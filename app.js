const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");

const app = express()

// let items = ["Buy Food", "Cook Food", "Eat Food"];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-ayush:Test123@cluster0.m28mf63.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema)

 const item1 = new Item({
     name: "Welcome to your todo list! "
 });

const item2 = new Item({
    name: "Hit the + button to add an item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function (req, res) {
    const day = date.getDate();
    try {
        const foundItems = await Item.find({});
            if (foundItems.length === 0)
            {
                Item.insertMany(defaultItems)
                .then(() => {
                    console.log("Default items inserted successfully");
                })
                .catch((error) => {
                    console.log("Error inserting default items:", error);
                });
                res.redirect("/");
            }
            else{
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }

    } catch (error) {
        console.log("Error retrieving items:", error);
        res.render("list", { kindOfDay: day, newListItems: [] }); // Render an empty list in case of error
    }
});

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems,
            });
            await list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", {
                listTitle: foundList.name,
                newListItems: foundList.items,
            });
        }
    } catch (err) {
        // Handle any errors that occur during the async operations
        console.error(err);
        // Send an appropriate response to the client
        // res.status(500).send("Internal Server Error");
    }
});

app.post("/", async (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    try {
        const item = new Item({
            name: itemName
        });

        if (listName === "Today") {
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });

            if (foundList) {
                foundList.items.push(item);
                await foundList.save();
                res.redirect("/" + listName);
            }
        }
    } catch (err) {
        console.error(err);
    }
});

app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    try {
        if (listName === "Today") {
            await Item.findByIdAndRemove(checkedItemId);
            console.log("Successfully deleted checked item.");
            res.redirect("/");
        } else {
            const foundList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } }
            );
            if (foundList) {
                res.redirect("/" + listName);
            }
        }
    } catch (err) {
        console.error(err);
    }
});

app.listen(3000, function(){
    console.log("Server started on port 3000")
});