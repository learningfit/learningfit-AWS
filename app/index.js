const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('<h1>Hello, ECS!</h1>');
});

app.use(express.json());
app.post('/calc', (req, res) => {
    payload = req.body;
    result = {
        answer: payload.a + payload.b
    }
    return res.json(result);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
