const express = require('express');
const router = express.Router();
const multer  = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const kid = process.env.KID || "Change-Me"
const secret = process.env.SECRET || "Change-Me"
const endpoint = process.env.ENDPOINT || "Change-Me"
const bucket = process.env.BUCKET || "Change-Me"

let space = new AWS.S3({
  //Get the endpoint from the DO website for your space
  endpoint: endpoint,
  useAccelerateEndpoint: false,
  //Create a credential using DO Spaces API key (https://cloud.digitalocean.com/account/api/tokens)
  credentials: new AWS.Credentials(kid, secret, null)

});

//Name of your bucket here
const BucketName = bucket;

/* Upload file */
router.post('/upload', upload.single('image'), function(req, res, next) {
  let uploadParameters = {
    Bucket: BucketName,
    ContentType: 'image/jpeg',
    Body: req.file.buffer,
    ACL: 'public-read',
    Key: uuidv4(),
  };

  space.upload(uploadParameters, function (error, data) {
    if (error){
      console.error(error);
      res.sendStatus(500);
      return;
    }
    res.json({url: data.Location})
  });
});


/* Returns the uploaded file */
router.get('/:fileName', function (req, res, next) {
  let downloadParameters = {
    Bucket: BucketName,
    Key: req.params.fileName
  };

  space.getObject(downloadParameters, function(error, data) {
    if (error){
      console.error(error);
      res.sendStatus(500);
      return;
    }
    res.contentType(data.ContentType);
    res.end(data.Body, 'binary');
  });
});

module.exports = router;
