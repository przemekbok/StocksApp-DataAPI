const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/street-fighters";

const Character = require("../models/Character");

mongoose.connect(url, { useNewUrlParser: true });

const db = mongoose.connection;
db.once("open", () => {
  console.log("Database connected:", url);
});

db.on("error", (err) => {
  console.error("connection error:", err);
});

async function saveCharacter(character) {
  await Character.deleteMany({});
  const c = new Character(character);
  return c.save();
}

async function updateCharacter(filter, update) {
  // const doc = await Character.findOneAndUpdate(filter, update);
  // return doc;
  const character = await Character.findOne(filter);
  Object.keys(update).forEach((key) => {
    character[key] = update[key];
  });
  return await character.save();
}

async function removeCharacter(filter) {
  const character = await Character.findOne(filter);
  return await character.remove();
}

// saveCharacter({
//   name: "Ryu",
//   ultimate: "Shinku Hadoken",
// })
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// saveCharacter({
//   name: "Ken",
//   ultimate: "Guren Enjinkyaku",
// })
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

updateCharacter(
  { name: "Ryu" },
  {
    specials: ["Hadoken", "Shoryuken", "Tatsumaki Senpukyaku"],
  }
)
  .then((doc) => {
    console.log(doc);
  })
  .catch((error) => {
    console.error(error);
  });

removeCharacter({ name: "Ken" })
  .then((doc) => {
    console.log(doc);
  })
  .catch((error) => {
    console.error(error);
  });
