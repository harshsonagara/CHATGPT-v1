const userModel = require("../models/user.model");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(req, res) {
    try {
        const { fullName: { firstName, lastName }, email, password } = req.body;

        const isUserAlreadyExists = await userModel.findOne({ email });

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: " User Already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            fullName: {
                firstName,
                lastName
            },
            email,
            password: hashedPassword
        });

        const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.cookie("token", token);

        res.status(201).json({
            message: "User register successfully",
            user: {
                email: user.email,
                _id: user._id,
                fullName: user.fullName,
            }
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({
        email,
    });

    if (!user) {
        return res.status(400).json({
            message: " Invalid email or password",
        });
    }

    const isPasswordValid = bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            message: " Invalid email or password",
        });
    }

    const token = await jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.cookie("token", token);

    res.status(201).json({
        message: "User logged in successfully",
        user: {
            email: user.email,
            _id: user._id,
            fullName: user.fullName,
        }
    });

}

module.exports = {
    registerUser,
    loginUser
}