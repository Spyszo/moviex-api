/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const User = require('mongoose').model('User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const fs = require('fs');
const path = require('path');
const transporter = require('../config/nodemailer');

const pathToPubKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToPubKey, 'utf8');

const LANG = require(`../lang/${process.env.LANGUAGE}.json`);

function emailIsValid(email) {
  return /\S+@\S+\.\S+/.test(email);
}

exports.verify = async (req, res) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) return res.json({ authenticated: false });

    const jwtPayload = jwt.verify(accessToken, PUB_KEY, ['RS256']);

    const user = await User.findOne({ _id: jwtPayload.sub });
    if (!user) return res.json({ authenticated: false });

    const newAccessToken = await user.issueJWT();

    const data = {
      id: user._id,
      displayName: user.displayName,
      accessToken: newAccessToken,
    };

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 1,
    });

    return res.status(200).json({ message: LANG.VERIFY_SUCCESS, user: data });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: LANG.INTERNAL_ERROR });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: LANG.LOGIN_EMPTYFIELDS });
    }

    const user = await User.findOne({ email });
    if (!user) { return res.status(400).json({ message: LANG.LOGIN_WRONDCREDENTIALS }); }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: LANG.LOGIN_WRONDCREDENTIALS });

    if (!user.activated) {
      return res
        .status(400)
        .json({ message: LANG.LOGIN_NOTACTIVATED });
    }

    const refreshToken = randtoken.uid(256);
    const refreshTokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24 * 3; // 3 days

    const accessToken = user.issueJWT();

    const data = {
      displayName: user.displayName,
      id: user._id,
      accessToken,
    };

    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;

    await user.save();

    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 2,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 4,
      });

    return res
      .status(200)
      .json({ message: LANG.LOGIN_SUCCESS, user: data });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: LANG.INTERNAL_ERROR });
  }
};

exports.register = async (req, res) => {
  try {
    const {
      email, password, passwordCheck, displayName,
    } = req.body;

    // validate
    if (!email || !password || !passwordCheck || !displayName) {
      return res
        .status(400)
        .json({ message: LANG.REGISTER_EMPTYFIELDS });
    }
    if (password.length < 5) {
      return res.status(400).json({
        message: LANG.REGISTER_SHORTPASSWORD,
      });
    }
    if (password !== passwordCheck) {
      return res
        .status(400)
        .json({ message: LANG.REGISTER_WRONGSECONDPASSWORD });
    }

    if (!emailIsValid(email)) {
      return res.status(400).json({ message: LANG.REGISTER_INVALIDEMAIL });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: LANG.REGISTER_ACCOUNTEXISTS });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(passwordCheck, salt);

    const activationToken = crypto.randomBytes(20).toString('hex');

    const newUser = new User({
      email,
      password: passwordHash,
      displayName,
      activated: false,
      activationToken,
    });

    await newUser.save();

    let activationLink = `://${process.env.HOST}:${process.env.PORT}/activate/?token=${activationToken}`;

    if (process.env.SSL) {
      activationLink = `https${activationLink}`;
    } else {
      activationLink = `http${activationLink}`;
    }

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: LANG.REGISTER_MAILSUBJECT,
      html: `<p>${LANG.REGISTER_MAILMESSAGE}<br><br> 
                    <a href="${activationLink}">${activationLink}</a> <br><br> 
                    ${LANG.REGISTER_SECONDMAILMESSAGE}
                 </p>`,
    };

    const mail = await transporter.sendMail(mailOptions);
    if (mail.accepted) {
      if (process.env.PRODUCTION) {
        return res.status(201).json({
          token: activationToken,
          message:
            LANG.REGISTER_SUCCESS,
        });
      }

      return res.status(201).json({
        message:
          LANG.REGISTER_SUCCESS,
      });
    }
    console.log('Mail problem or Register error after function findOne');
    return res.status(500).json({ message: LANG.INTERNAL_ERROR });
  } catch (err) {
    console.log('Internal error: ', err);
    return res.status(500).json({ message: LANG.INTERNAL_ERROR });
  }
};

exports.logout = async (req, res) => {
  res.cookie('accessToken', '').cookie('refreshToken', '');

  return res.status(200).json({ message: LANG.LOGOUT_SUCCESS });
};

exports.delete = async (req, res) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await existingUser.remove();
    return res.status(200).json({ message: LANG.DELETE_SUCCESS });
  }
  return res.status(404).json({ message: 'User not found' });
};
