import express from "express";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
    if (err) {
        console.log("Connection failed:", err);
    } else {
        console.log("Connected to MySQL");
    }
});

app.get("/", (req, res) => {
    const student = {
        name: "Raghu",
        age: 20,
    }
    return res.json({ "message": "Hello World", "student": student })
})


app.post("/addSchool", (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ "message": "All fields are required" })
    }
    if (typeof name !== "string" || typeof address !== "string") {
        return res.status(400).json({ message: "Name and address must be strings" });
    }
    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Latitude and longitude must be numbers" });
    }
    if (latitude < -90 || latitude > 90) {
        return res.status(400).json({ message: "Latitude must be between -90 and 90" });
    }
    if (longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Longitude must be between -180 and 180" });
    }


    const query=`insert into schools (name,address,latitude,longitude) values(?,?,?,?)`;
    db.query(query,[name,address,latitude,longitude],(err,result)=>{
        if(err){
            console.log("Error inserting data:", err);
            return res.status(500).json({ "message": "Internal server error" });
        }
        return res.json({ message: "School added successfully", schoolId: result.insertId });
    })
})


app.get("/listSchools", (req, res) => {
  const { latitude, longitude } = req.query;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: "Invalid coordinates" });
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  db.query("SELECT * FROM schools", (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    console.log("Fetched schools:", results);

    const schoolsWithDistance = results.map((school) => {
      const distance = Math.sqrt(
        Math.pow(userLat - school.latitude, 2) +
        Math.pow(userLon - school.longitude, 2)
      );
      console.log({...school, distance });
      return { ...school, distance };
    });
    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      message: "Schools sorted by proximity",
      data: schoolsWithDistance
    });
  });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})