const UserModel = require("../models/user.model");
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const { uploadErrors } = require("../utilis/errors.utils");

exports.uploadProfil = async (req, res) => {
    try {
        if (
            req.file.mimetype !== "image/jpg" &&
            req.file.mimetype !== "image/png" &&
            req.file.mimetype !== "image/jpeg"
        ) throw Error("invalid file");
        if (req.file.size > 5000000) throw Error("max size");
    } catch (err) {
        const errors = uploadErrors(err);
        return res.status(400).json({ errors });
    }
    const fileName = req.body.name + ".jpg";

    await fs.promises.writeFile(
        `${__dirname}/../../frontend/public/img/${fileName}`,
        req.file.buffer
    );

    try {
        await UserModel.findByIdAndUpdate(
            req.body.userId,
            { $set: { picture: "./img/" + fileName } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));

    } catch (err) {
        return res.status(500).send({ message: err });
    }
};