const express = require("express");
const app = express();

app.get("/", (req, res) => {
	res.json({ code: "200" });
});

const port = 9999;
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
