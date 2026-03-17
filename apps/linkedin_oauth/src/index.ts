import express from 'express';

const app = express();

console.log("Hey 3")
app.listen(8001, () => {
  console.log(`linkedin oauth server is running ${8003}`)
})