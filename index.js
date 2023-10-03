const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Configure AWS SDK with your credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1', // Replace with your desired AWS region
});

// Create an S3 client
const s3 = new AWS.S3();

// Multer middleware for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define a route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileData = req.file.buffer; // File data in memory

    const params = {
        Bucket: 'testawsbucketnftgames', // Replace with your S3 bucket name
        Key: `uploads/${Date.now()}_${req.file.originalname}`, // Destination path in S3
        Body: fileData,
    };

    // Upload the file to S3
    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading file to S3:', err);
            return res.status(500).json({ message: 'Error uploading file' });
        }

        console.log('File uploaded successfully:', data.Location);
        res.json({ message: 'File uploaded to S3', fileUrl: data.Location });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
