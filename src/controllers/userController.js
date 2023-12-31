const Joi = require('joi');
const { userService } = require('../services');
const { generateToken } = require('../auth/authFunctions');

const validateBody = (body) =>
  Joi.object({
    displayName: Joi.string().min(8).required(),
    email: Joi.string().email().required().messages({
      'string.empty': '"email" must be a valid email',
      'any.required': '"email" must be a valid email',
      'string.email': '"email" must be a valid email',
    }),
    password: Joi.string().min(6).required(),
    image: Joi.string(),
  }).messages({
    'string.min': '{:#key} length must be at least {#limit} characters long',
    'any.required': '{:#key} length must be at least {#limit} characters long',
  }).validate(body);

const createUser = async (req, res, next) => {
  const { error } = validateBody(req.body);
  if (error) return next(error);
  const { body } = req;
  const userEmail = await userService.getByEmail(body.email);
  if (userEmail) { return res.status(409).json({ message: 'User already registered' }); }
  if (!body.image) {
    body.image = null;
  }
  userService.createUser(body);

  const { password: _password, ...userWithoutPassword } = req.body;
  const payload = { data: userWithoutPassword };
  const token = generateToken(payload);

  return res.status(201).json({ token });
};

const findAll = async (_req, res) => {
  const allUsers = await userService.findAll();
  return res.status(200).json(allUsers);
};

const findById = async (req, res, next) => {
  const { id } = req.params;
  const user = await userService.findById(id);
  if (!user) {
    const err = new Error('User does not exist');
    err.statusCode = 404;
    return next(err);
  }
  return res.status(200).json(user);
};

const destroy = async (req, res) => {
  const { data } = req.payload;
  await userService.destroy(data.id);
  return res.status(204).end();
};

module.exports = { createUser, findAll, findById, destroy };