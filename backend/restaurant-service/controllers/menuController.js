const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");
const { sanitizeInput } = require("../middleware/validation");

//  Get All Menu Items
const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ message: "Error fetching menus" });
  }
};

//  Get Menu Items by Restaurant (Only if owned by the user)
const getMenusByRestaurant = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant ID format" });
    }

    const restaurant = await Restaurant.findOne({
      _id: { $eq: req.params.restaurantId },
      owner: { $eq: req.user.id },
    });
    if (!restaurant)
      return res
        .status(404)
        .json({ message: "Restaurant not found or not authorized" });

    const menus = await Menu.find({ restaurant: { $eq: req.params.restaurantId } });
    res.json(menus);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Error fetching menu items" });
  }
};

//  Get a Single Menu Item by ID
const getMenuById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid menu item ID format" });
    }

    const menu = await Menu.findOne({ _id: { $eq: req.params.id } });
    if (!menu) return res.status(404).json({ message: "Menu item not found" });
    res.json(menu);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ message: "Error fetching menu item" });
  }
};

//  Add a Menu Item (Only if owned by the user)
const addMenuItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant ID format" });
    }

    const restaurant = await Restaurant.findOne({
      _id: { $eq: req.params.restaurantId },
      owner: { $eq: req.user.id },
    });
    if (!restaurant)
      return res
        .status(404)
        .json({ message: "Restaurant not found or not authorized" });

    const { name, price, category, description } = req.body;
    const newMenuItem = new Menu({
      restaurant: req.params.restaurantId,
      name,
      price,
      category,
      description,
    });
    await newMenuItem.save();

    await Restaurant.findOneAndUpdate(
      { _id: { $eq: req.params.restaurantId } },
      { $push: { menu: newMenuItem._id } }
    );

    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ message: "Error adding menu item" });
  }
};

//  Update a Menu Item (Only if owned by the user)
const updateMenuItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid menu item ID format" });
    }

    const updatedMenuItem = await Menu.findOneAndUpdate(
      { _id: { $eq: req.params.id } },
      req.body,
      { new: true }
    );
    if (!updatedMenuItem)
      return res.status(404).json({ message: "Menu item not found" });
    res.json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "Error updating menu item" });
  }
};

//  Delete a Menu Item (Only if owned by the user)
const deleteMenuItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid menu item ID format" });
    }

    const menuItem = await Menu.findOne({ _id: { $eq: req.params.id } });
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

    await Restaurant.findOneAndUpdate(
      { _id: { $eq: menuItem.restaurant } },
      { $pull: { menu: menuItem._id } }
    );
    await Menu.findOneAndDelete({ _id: { $eq: req.params.id } });

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Error deleting menu item" });
  }
};

// Export the controller functions
module.exports = {
  getAllMenus,
  getMenusByRestaurant,
  getMenuById,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
