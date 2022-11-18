const Sauce = require('../models/Sauce');
const fs = require('fs');

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
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
            res.status(401).json({ message : 'Not authorized'});
          } else {
            if (req.file) {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
              });
            } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
            }
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
          res.status(401).json({message: 'Not authorized'});
      } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
              Sauce.deleteOne({_id: req.params.id})
                .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                .catch(error => res.status(401).json({ error }));
          });
      }
    })
    .catch( error => {
        res.status(500).json({ error });
    });
};

exports.likeState = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (req.body.userId != req.auth.userId) {
        res.status(401).json({message: 'Not authorized'});
      } else {
        const likeReq = req.body.like;
        const userIdReq = req.body.userId;

        if (req.body.like > 1 || req.body.like < -1 || !Number.isInteger(req.body.like)) {
          res.status(403).json({ error });

        } else if (sauce.usersLiked.includes(userIdReq)) {
          Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $set: { likes: (sauce.usersLiked.length - 1)}})
            .then(() => { res.status(200).json({message: 'Like enlevé !'})})
            .catch(error => res.status(405).json({ error }));

        } else if (sauce.usersDisliked.includes(userIdReq)) {
          Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $set: { dislikes: (sauce.usersDisliked.length - 1)}})
            .then(() => { res.status(200).json({message: 'Dislike enlevé !'})})
            .catch(error => res.status(405).json({ error }));

        } else {
          if (likeReq === 1) {
            Sauce.updateOne({ _id: req.params.id }, { $addToSet:{ usersLiked: req.body.userId }, $set: { likes: (sauce.usersLiked.length + 1)}})
              .then(() => { res.status(200).json({message: 'Like ajouté !'})})
              .catch(error => res.status(405).json({ error }));

          } else if (likeReq === -1) {
            Sauce.updateOne({ _id: req.params.id }, { $addToSet:{ usersDisliked: req.body.userId }, $set: { dislikes: (sauce.usersDisliked.length + 1)}})
              .then(() => { res.status(200).json({message: 'Dislike ajouté !'})})
              .catch(error => res.status(405).json({ error }));

          } else {
            res.status(403).json({ error });

          }
        }
      }
    });
};

/* 
        if (likeReq === 0) {
          Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: req.body.userId } })
              .then(() => {
                  return Sauce.updateOne(
                      { _id: req.params.id },
                      { $inc: { dislikes: +1 }, $pull: { usersDisliked: req.body.userId } }
                  );
              })
              .then(() => {
                  res.status(201).json({ message: 'Like or dislike has been canceled' });
              })
              .catch((error) => res.status(400).json({ error }));

        } else if (likeReq === 1) {
          Sauce.updateOne({ _id: req.params.id}, { $inc:{ likes: +1}, $push:{ usersLiked: req.body.userId }})
            .then(() => { res.status(201).json({ message: 'Like has been increased'})})
            .catch(error => res.status(401).json({ error }));
        } else if (likeReq === -1){
          Sauce.updateOne({ _id: req.params.id}, { $inc:{ dislikes: +1}, $push:{ usersDisliked: req.body.userId }})
            .then(() => { res.status(201).json({ message: 'Dislike has been increased'})})
            .catch(error => res.status(401).json({ error }));
        } else {
          Sauce.updateOne()
            .catch(error => res.status(403).json({ error }));
        }
      }
    });


exports.getAllSauces = (req, res, next) => {
    const sauces = [
      {
        _id: 'oeihfzeoi',
        userId: 'qsomihvqios',
        name: 'La sauce du démon',
        manufacturer : 'Herta',
        description: 'La sauce du démon ne laisse pas indifférente, vous êtes satellisé !',
        mainPepper : 'Piments de cayenne',
        imageUrl: 'https://www.graines-semences.com/2022/piment-100-graines.jpg',
        heat : 7,
        likes : 1,
        dislikes : 0,
        usersLiked : ['qsomihvqios'],
        usersDisliked : [],
      },
    ];
    res.status(200).json(sauces);
}; 

        const userLikeIndex = sauce.usersLiked.indexOf(req.body.userId);
        const userDislikeIndex = sauce.usersLiked.indexOf(req.body.userId);
        
        if (req.body.like === 1) {
          if (userDislikeIndex) {
            sauce.usersDisliked.splice(userDislikeIndex, 1);
            sauce.dislikes--;
            sauce.usersLiked.push(req.body.userId);
            sauce.likes++;
          } else {
            sauce.usersLiked.push(req.body.userId);
            sauce.likes++;
          }
        } else if (req.body.like === -1) {
          if (userLikeIndex) {
            sauce.usersLiked.splice(userLikeIndex, 1);
            sauce.likes--;
            sauce.usersDisliked.push(req.body.userId);
            sauce.dislikes++;
          } else {
            sauce.usersDisliked.push(req.body.userId);
            sauce.dislikes++;
          }
        } else {
          if (userLikeIndex) {
            sauce.usersLiked.splice(userLikeIndex, 1);
            sauce.likes--;
          } else {
            sauce.usersDisliked.splice(userDislikeIndex, 1);
            sauce.dislikes--;
          }
        }*/