const Sauce = require('../models/Sauce');

exports.createSauce = (req, res, next) =>{
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filname}`
  });

  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(thing => res.status(200).json(thing))
    .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(things => res.status(200).json(things))
    .catch(error => res.status(400).json({ error }));
};

/* exports.getAllSauces = (req, res, next) => {
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
}; */