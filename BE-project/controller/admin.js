const Food = require('../models/food');
const DeletedFood = require('../models/deleted-food');
const Category = require('../models/category');
const DeletedCategory = require('../models/deleted-category');
const User = require('../models/user');
const { httpStatus } = require('../utils/httpStatus');

exports.postCreateFood = async (req, res, next) => {
  try {
    const name = req.body.name;
    const categoryId = req.body.categoryId;
    const price = req.body.price;
    const images = req.body.images;
    const posterImage = images[0];
    const description = req.body.description;
    const bestDeals = req.body.bestDeals;
    const popular = req.body.popular;
    const food = new Food({
      name,
      categoryId,
      price,
      images,
      posterImage,
      description,
      bestDeals,
      popular,
    });
    await food.save();
    const category = await Category.findById(categoryId);
    category.foods = [...category.foods, food._id];
    await category.save();
    res.status(httpStatus.CREATED).json({
      message: 'Food created successfully',
      food: food,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.postCreateCategory = async (req, res, next) => {
  try {
    const name = req.body.name;
    const image = req.body.image;
    const imageRef = req.body.imageRef;
    const popular = req.body.popular;
    const foods = [];
    const category = new Category({
      name,
      image,
      imageRef,
      popular,
      foods,
    });
    await category.save();
    res.status(httpStatus.CREATED).json({
      message: 'Category created successfully',
      category: category,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    const foodId = req.params.foodId;
    const name = req.body.name;
    const categoryId = req.body.categoryId;
    const price = req.body.price;
    const images = req.body.images;
    const posterImage = images[0];
    const description = req.body.description;
    const bestDeals = req.body.bestDeals;
    const popular = req.body.popular;
    const food = await Food.findById(foodId);
    food.name = name;
    food.categoryId = categoryId;
    food.price = price;
    food.images = images;
    food.posterImage = posterImage;
    food.description = description;
    food.bestDeals = bestDeals;
    food.popular = popular;
    const updatedFood = await food.save();
    res.status(httpStatus.OK).json({
      message: 'Food updaded',
      food: updatedFood,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const foodId = req.params.foodId;
    const food = await Food.findByIdAndRemove(foodId);
    const deletedFood = new DeletedFood({
      name: food.name,
      categoryId: food.categoryId || '',
      price: food.price,
      images: food.images,
      posterImage: food.posterImage,
      description: food.description,
      bestDeals: food.bestDeals,
      popular: food.popular,
    });
    if (deletedFood.categoryId !== '') {
      const category = await Category.findById(food.categoryId);
      const foodIndex = category?.foods.findIndex(
        (item) => item._id === food._id
      );
      category?.foods.splice(foodIndex, 1);
      await category?.save();
    }
    await deletedFood.save();
    res.status(httpStatus.OK).json({
      message: 'Delete food successfully',
      food: food,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const name = req.body.name;
    const popular = req.body.popular;
    // const image = req.body.image;
    const category = await Category.findById(categoryId);
    category.name = name;
    category.popular = popular;
    const updatedCategory = await category.save();
    res.status(httpStatus.OK).json({
      message: 'Update category successfully',
      category: updatedCategory,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);
    // const foods = await Food.find({ categoryId: category._id });
    // foods.map((food) => ({ ...food, categoryId: '' }));
    // await foods.save();
    Food.updateMany(
      { categoryId: category._id },
      {
        $set: {
          categoryId: '',
        },
      }
    );
    const deletedCategory = new DeletedCategory({
      name: category.name,
      image: category.image,
      imageRef: category.imageRef,
      popular: category.popular,
      foods: category.foods,
    });
    await deletedCategory.save();
    await category.remove();
    res.status(httpStatus.OK).json({
      message: 'Delete category successfully',
      category: category,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    let users = [];
    let userParams = {};
    if (req.query.search) {
      userParams = {
        ...userParams,
        $text: { $search: req.query.search },
      };
    }
    const totalItems = await User.find(userParams).countDocuments();
    if (req.query.page) {
      const currentPage = req.query.page;
      const perPage = 5;
      users = await User.find(userParams)
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    } else {
      users = await User.find(userParams);
    }
    res.status(httpStatus.OK).json({
      message: 'Fetched users successfully',
      users: users,
      totalItems: totalItems,
    });
  } catch (error) {
    if (!error) {
      error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }
    next(error);
  }
};
