const Admin = require("../../models/admin")
const bcrypt = require("bcrypt")
require("dotenv").config()
const jwt = require('jsonwebtoken')


exports.adminLogin = async (req, res, next) => {
    const { adminId, password } = req.body;

    // console.log(adminId, password);

    const admin = await Admin.findOne({ adminId: adminId });

    // console.log(admin);

    if (!admin) {
        return res.status(404).json({
            msg: "Error"
        });
    }

    try {
        // Check if the provided password matches the hashed password
        const matchHashed = await bcrypt.compare(password, admin.password);
        // If the hashed password matches, generate token and return success
        if (matchHashed) {
            const token = jwt.sign({ adminId }, process.env.AUTH_SCRETE_KEY, { expiresIn: '1h' });
            return res.status(200).json({
                msg: "Login successfully",
                token,
                adminId,
                name : admin.name
            });
        } else {
            // Check if the provided password matches the plain text password
            if (password === admin.password) {
                const token = jwt.sign({ adminId }, process.env.AUTH_SCRETE_KEY, { expiresIn: '1h' });
                return res.status(200).json({
                    msg: "Login successfully",
                    token,
                    adminId,
                    name : admin.name
                });
            } else {
                return res.status(404).json({
                    msg: "Provide valid adminId or password",
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Something went wrong",
        });
    }
};


exports.changePassword = async (req,res,next)=>{
    const {adminId,newPassword} = req.body

    const admin = await Admin.findOne({ adminId: adminId });

    if (!admin) {
        return res.status(404).json({
            msg: "Error"
        });
    }

    try {
        const salt = await bcrypt.genSalt(10)
        const hashedPassWord = await bcrypt.hash(newPassword,salt)
        admin.password = hashedPassWord;
        admin.save()
        return res.status(200).json({
            msg :"password updated successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Something went wrong",
        });
    }

}