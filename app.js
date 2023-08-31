const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const uri =
  "mongodb+srv://demo1:asd123@demo1.ept6dzj.mongodb.net/?retryWrites=true&w=majority";

// Mongoose bağlantısı
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema, "itemCollection");

const item1 = new Item({
  name: "Welcome to your to-do list Mr Inan!",
});

const item2 = new Item({
  name: "Hit the + button to add an item",
});

const item3 = new Item({
  name: "<== Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  async function foundItems() {
    try {
      const items = await Item.find({});
      if (items.length === 0) {
        await insertDefaultItems();
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    } catch (err) {
      console.error("Itemler bulunamadı", err);
    }
  }

  async function insertDefaultItems() {
    try {
      await Item.insertMany(defaultItems);
      console.log("Items başarıyla eklendi");
    } catch (err) {
      console.error("Items eklenirken hata oluştu", err);
    }
  }

  foundItems();
});

app.get("/:customListName", async function (req, res) {
  const customListName = req.params.customListName;

  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save().then(() => {
        res.redirect("/" + customListName);
      });
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    console.error("Liste bulunurken hata oluştu", err);
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item
      .save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error("öğeler kaydedilirken hata oluştu", err);
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error("Liste kaydedilirken hata oluştu", err);
      });
  }
});

app.post("/delete", function (req, res) {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error("öğe kaydedilirken hata oluştu", err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(() => {
      res.redirect("/" + listName);
    });
  }
});

app.listen(4000, function () {
  console.log("Server started on port 3000");
});
