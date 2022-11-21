const Sauce = require('../models/Sauce');
const fs = require('fs');


// Création d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0
  });

  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée'}))
    .catch(error => res.status(400).json({ error }));
};


// Envoie des données d'une sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
};


// Envoie de toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};


// Modification d'une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
            res.status(401).json({ message : 'Non autorisé'});

          } else {

            // S'il y a modification de l'image, suppression de l'ancienne image dans le dossier
            if (req.file) {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée'}))
                .catch(error => res.status(401).json({ error }));
              });

            } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Sauce modifiée'}))
              .catch(error => res.status(401).json({ error }));

            }
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};


// Suppression d'une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
          res.status(401).json({message: 'Non autorisé'});
      } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
              Sauce.deleteOne({_id: req.params.id})
                .then(() => { res.status(200).json({message: 'Sauce supprimé'})})
                .catch(error => res.status(401).json({ error }));
          });
      }
    })
    .catch( error => {
        res.status(500).json({ error });
    });
};


// Gestion des likes
exports.likeState = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (req.body.userId != req.auth.userId) {
        res.status(401).json({message: 'Non autorisé'});
      } else {
        const likeReq = req.body.like;
        const userIdReq = req.body.userId;

        if (likeReq === 1) {
          Sauce.updateOne(
            { _id: req.params.id }, 
            { $addToSet:{ usersLiked: userIdReq }, $set: { likes: (sauce.usersLiked.length + 1)}}
            )
            .then(() => { res.status(200).json({message: 'Like ajouté'})})
            .catch(error => res.status(400).json({ error }));

        } else if (likeReq === -1) {
          Sauce.updateOne(
            { _id: req.params.id },
            { $addToSet:{ usersDisliked: userIdReq }, $set: { dislikes: (sauce.usersDisliked.length + 1)}}
            )
            .then(() => { res.status(200).json({message: 'Dislike ajouté'})})
            .catch(error => res.status(400).json({ error }));

        } else if (likeReq === 0) {
          if (sauce.usersLiked.includes(userIdReq)) {
            Sauce.updateOne(
              { _id: req.params.id }, 
              { $pull: { usersLiked: userIdReq }, $set: { likes: (sauce.usersLiked.length - 1)}}
              )
              .then(() => { res.status(200).json({message: 'Like enlevé'})})
              .catch(error => res.status(400).json({ error }));

          } else if (sauce.usersDisliked.includes(userIdReq)) {
            Sauce.updateOne(
              { _id: req.params.id }, 
              { $pull: { usersDisliked: userIdReq }, $set: { dislikes: (sauce.usersDisliked.length - 1)}}
              )
              .then(() => { res.status(200).json({message: 'Dislike enlevé'})})
              .catch(error => res.status(400).json({ error }));
            
          } else {
            res.status(400).json({ error });
          }
        } else {
          res.status(400).json({ error });

        }
      }
    });
};