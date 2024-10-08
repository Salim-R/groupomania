const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");
const ObjectId = require('mongoose').Types.ObjectId;
const { uploadErrors } = require("../utilis/errors.utils");
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

exports.readPost = (req, res) => {
    PostModel.find((err, docs) => {
        if (!err) res.send(docs);
        else console.log('Error to get data : ' + err);
    }).sort({ createdAt: -1 });
};

exports.createPost = async (req, res) => {
    let fileName;

    console.log("Request Body:", req.body);
    console.log("Request File:", req.file);

    if (req.file) {
        try {
            if (
                req.file.mimetype !== "image/jpg" &&
                req.file.mimetype !== "image/png" &&
                req.file.mimetype !== "image/jpeg"
            ) throw Error("invalid file");

            if (req.file.size > 5000000) throw Error("max size");
        } catch (err) {
            const errors = uploadErrors(err);
            console.log("File Upload Error:", errors);
            return res.status(400).json({ errors });
        }
        fileName = req.body.posterId + Date.now() + ".jpg";

        await fs.promises.writeFile(
            `${__dirname}/../../frontend/public/img/posts/${fileName}`,
            req.file.buffer
        );
    }

    const newPost = new PostModel({
        posterId: req.body.posterId,
        message: req.body.message,
        picture: req.file ? "img/posts/" + fileName : "",
        video: req.body.video,
        likers: [],
        comments: [],
    });

    try {
        const post = await newPost.save();
        return res.status(201).json(post);
    } catch (err) {
        return res.status(400).send(err);
    }
};

exports.updatePost = (req, res) => {
    if (ObjectId.isValid(req.params.id) || req.user.isAdmin === true) {
        const updatedRecord = {
            message: req.body.message
        };
        PostModel.findByIdAndUpdate(
            req.params.id,
            { $set: updatedRecord },
            { new: true },
            (err, docs) => {
                if (!err) res.send(docs);
                else console.log("Update error: " + err);
            }
        );
    } else {
        return res.status(400).send('ID inconnu : ' + req.params.id);
    }
};

exports.deletePost = (req, res) => {
    if (ObjectId.isValid(req.params.id) || req.user.isAdmin === true) {
        PostModel.findByIdAndRemove(
            req.params.id,
            (err, docs) => {
                if (!err) res.send(docs);
                else console.log("Delete error : " + err);
            }
        );
    } else {
        return res.status(400).send('ID inconnu : ' + req.params.id);
    }
};

exports.likePost = async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
        return res.status(400).send("ID unknown : " + req.params.id);

    try {
        await PostModel.findByIdAndUpdate(
            req.params.id,
            {
                $addToSet: { likers: req.body.id },
            },
            { new: true }
        )
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));

        await UserModel.findByIdAndUpdate(
            req.body.id,
            {
                $addToSet: { likes: req.params.id },
            },
            { new: true }
        )
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));
    } catch (err) {
        return res.status(400).send(err);
    }
};

exports.unlikePost = async (req, res) => {
    if (!ObjectId.isValid(req.params.id))
        return res.status(400).send("ID unknown : " + req.params.id);

    try {
        await PostModel.findByIdAndUpdate(
            req.params.id,
            {
                $pull: { likers: req.body.id },
            },
            { new: true }
        )
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));

        await UserModel.findByIdAndUpdate(
            req.body.id,
            {
                $pull: { likes: req.params.id },
            },
            { new: true }
        )
            .then((data) => res.send(data))
            .catch((err) => res.status(500).send({ message: err }));
    } catch (err) {
        return res.status(400).send(err);
    }
};

exports.commentPost = (req, res) => {
    if (!ObjectId.isValid(req.params.id))
        return res.status(400).send('ID inconnu : ' + req.params.id);

    try {
        return PostModel.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        commenterId: req.body.commenterId,
                        commenterPseudo: req.body.commenterPseudo,
                        text: req.body.text,
                        timestamp: new Date().getTime()
                    }
                }
            },
            { new: true },
            (err, docs) => {
                if (!err) return res.send(docs);
                else return res.status(400).send(err);
            }
        );
    } catch (err) {
        return res.status(400).send(err);
    }
};

exports.editCommentPost = (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        try {
            return PostModel.findById(req.params.id, (err, docs) => {
                const theComment = docs.comments.find((comment) =>
                    comment._id.equals(req.body.commentId)
                );

                if (!theComment) return res.status(404).send('Comment not found');
                theComment.text = req.body.text;

                return docs.save((err) => {
                    if (!err) return res.status(200).send(docs);
                    return res.status(500).send(err);
                });
            });
        } catch (err) {
            return res.status(400).send(err);
        }
    } else {
        return res.status(400).send('ID inconnu : ' + req.params.id);
    }
};

exports.deleteCommentPost = (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        try {
            return PostModel.findByIdAndUpdate(
                req.params.id,
                {
                    $pull: {
                        comments: {
                            _id: req.body.commentId,
                        }
                    }
                },
                { new: true },
                (err, docs) => {
                    if (!err) return res.send(docs);
                    else return res.status(400).send(err);
                }
            );
        } catch (err) {
            return res.status(400).send(err);
        }
    } else {
        return res.status(400).send('ID inconnu : ' + req.params.id);
    }
};
