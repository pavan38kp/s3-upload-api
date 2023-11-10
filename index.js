require("dotenv").config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const {axios} = require("./lib/axios")

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

const appendCountryCode = (phno, cc = "+91") => {
    if (phno.startsWith('+')) {
        return phno
    }

    return `${cc}${phno}`
}


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


app.post("/otp/send", async (req, res) => {
    try {
        const {recipient} = req.body;
        console.log(recipient);
        console.log(appendCountryCode(`${recipient}`));
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const OTP = generateOTP(6);

        await axios({
            method: "POST",
            url: "/api/rest/admin/otp/add",
            data: {
                v: OTP
            }
        })

        const response = await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: appendCountryCode(`${recipient}`),
            body: req.query?.auth === "true" ? `Your OTP from Housezy is ${OTP}` : `Your OTP to acknowledge Housezy service completion is ${OTP}`
        })

        return res.json({
            status: 200,
            body: {
                message: 'OTP sent successfully',
                data: response.sid
            }
        })
    } catch (err) {
        return res.json({
            status: 500,
            errro: err
        })
    }
})


app.post("/otp/verify", async (req, res) => {
    try {
        const {otp} = req.body;
        const otpRecord = await axios.post("/api/rest/admin/otp", {otp})

        if (otpRecord.data.otp.length === 0) {
            return res.json({
                body: {
                    message: 'Invalid OTP',
                }
            }, {
                status: 400
            })
        }

        const OTP = otpRecord.data.otp[0]

        if (OTP.created_at + 5 * 60 * 1000 < Date.now()) {
            return res.json({
                body: {
                    message: 'OTP expired',
                }
            }, {
                status: 400,
            })
        }

        await axios({
            method: "DELETE",
            url: "/api/rest/admin/otp/blacklist",
            data: {
                id: OTP.id
            }
        })

        return res.json({
            status: 200,
            body: {
                message: 'OTP verified successfully',
                data: ''
            }
        })
    } catch (err) {
        return res.json({
            status: 500,
            errro: err
        })
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
