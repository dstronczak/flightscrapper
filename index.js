const axios = require('axios');
const cheerio = require('cheerio');
// Load the SDK for JavaScript
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-1'});

var date = getFormattedDate(new Date(), 1);

const url = 'https://breakplan.pl/inspiracje/okazja/tanie-loty-okazje-z-dnia-' + date;

exports.myHandler = function(event, context, callback) {   
    axios.get(url)
    .then(response => {
        getData(response.data)
        if(callback)
            callback(null, "Success");
    })
    .catch(error => {
        console.log(error);
        console.log("Error trying to get offers from " + url);
    })
    
    
}



let getData = html => {
    data = [];
    filteredData = [];
    emailBody = "";
    const $ = cheerio.load(html);
    $('.body_container p').each((i, elem) => {
        //for "Poprzednie okazje" we end scraping
        if($(elem).children("strong").attr('style') != undefined)
        {
            if($(elem).children("strong").attr('style').includes("underline")){
                console.log($(elem).text());
                return false;
            }
        }

        if($(elem).text().trim() == "")
            return;
        
            
        let title = $(elem).children("strong").first().text().trim();
        let text = $(elem).text();
        let link = $(elem).children("strong").eq(1).find("a").attr('href');
        let linkTag = $(elem).children("strong").eq(1).find("a");

        data.push({
        title : title,
        text: text,
        link :  link
        // link : $(elem).find('a.storylink').attr('href')
        });

        if(title.toLowerCase().includes("krakow") ||
            title.toLowerCase().includes("katowic")){

            filteredData.push({
                title : title,
                text: text,
                link :  link,
                linkTag: linkTag

            });

            emailBody += "-> " + text + ": "+ "<a href='" + link + "'>LINK</a><br\><br\>";
            
        }




    });
    // console.log(data);
    // console.log(data.length)

    console.log(filteredData);
    console.log(filteredData.length)

    if(emailBody){
        emailBody += "<br\><hr\><br\> Liczba ofert: " + filteredData.length
        sendEmail(emailBody);
        // console.log(emailBody)
    }


}

function getFormattedDate(date, daysToSubstract) {
    date.setDate(date.getDate() - daysToSubstract);

    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
  
    return day + '-' + month + '-' + year;
}


function sendEmail(body){

// Create sendEmail params 
var params = {
    Destination: { /* required */
    //   CcAddresses: [
    //     '',
    //     /* more items */
    //   ],
      ToAddresses: [
        'dstronczak@gmail.com',
        /* more items */
      ]
    },
    Message: { /* required */
      Body: { /* required */
        Html: {
         Charset: "UTF-8",
         Data: body
        },
        Text: {
         Charset: "UTF-8",
         Data: body
        }
       },
       Subject: {
        Charset: 'UTF-8',
        Data: '[loty] Okazje ' + date
       }
      },
    Source: 'dstronczak@gmail.com', /* required */
    ReplyToAddresses: [
       'dstronczak@gmail.com',
      /* more items */
    ],
  };

  // Create the promise and SES service object
var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

// Handle promise's fulfilled/rejected states
sendPromise.then(
  function(data) {
    console.log("Email sent - " + data.MessageId);
  }).catch(
    function(err) {
    console.log("Error - email not sent:")
    console.error(err, err.stack);
  });
}