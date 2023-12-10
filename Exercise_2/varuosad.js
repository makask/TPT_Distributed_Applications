const http = require('http');
const fs = require('fs');
const { URLSearchParams } = require('url');
 
const hostname = '127.0.0.1';
const port = 3300;

const data2 = [];
let lines = undefined;

// Serial number
// Name
// 5 storage unit
// 6 unknown property 
// price without VAT
// type
// price + VAT

// Read file here
fs.readFile('./LE.txt', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const decoded = new TextDecoder('windows-1252').decode(data);
    
    lines = decoded.split("\n");
    let data1 = [];

    for(let i = 0; i < lines.length; i++){
       data1.push(lines[i].split("\t"));
    }
    
    data1.forEach((element) => {

        for(let i = 0; i < element.length; i++){
            element[i] = element[i].replaceAll('"',"");
        }
        
        const part = { serialNumber : element[0], 
                       name : element[1], 
                       storage1 : element[2],
                       storage2 : element[3],
                       storage3 : element[4],
                       storage4 : element[5],
                       storage5 : element[6],
                       unknown : element[7],
                       price : element[8],
                       type: element[9],
                       priceVAT : element[10]
                    };
        data2.push(part);
    })
});
 
const server = http.createServer((req, res) => {
 
  let url = req.url;
  let urlWithoutParams = getUrlWithoutParams(url);
  let queryParams = getQueryParams(req.url);
  let hasParams = queryParams !== undefined ? true : false;

  switch(true){
    case url === "/spare-parts": //Show all parts: localhost:3300/spare-parts 
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data2));
      break;
    case urlWithoutParams === "/spare-parts" && "name" in queryParams && "page" in queryParams && "sort" in queryParams: // Search by name, paginate and sort results: localhost:3300/spare-parts?name=polt&page=2&sort=price 
      if(queryParams.sort === "price"){ //Sort ascending: localhost:3300/spare-parts?name=polt&page=2&sort=price
        let result = searchByName(queryParams.name, data2);
        sortAscending(result);
        let resPaginated = paginate(result.length, 30, queryParams.page, result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(resPaginated));
      }
     else if(queryParams.sort === "-price"){ //Sort descending: localhost:3300/spare-parts?name=polt&page=2&sort=-price
        let result = searchByName(queryParams.name, data2);
        sortDescending(result);
        let resPaginated = paginate(result.length, 30, queryParams.page, result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(resPaginated));
      }
      break;
    case urlWithoutParams === "/spare-parts" && "name" in queryParams && "sort" in queryParams: // Search by name and sort by price: localhost:3300/spare-parts?name=polt&sort=price
      if(queryParams.sort === "price"){ //Sort ascending: localhost:3300/spare-parts?name=polt&sort=price
        let result = searchByName(queryParams.name, data2);
        sortAscending(result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      }else if(queryParams.sort === "-price"){ // Sort descending localhost:3300/spare-parts?name=polt&sort=-price
        let result = searchByName(queryParams.name, data2);
        sortDescending(result);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      }
      break;
    case urlWithoutParams === "/spare-parts" && "name" in queryParams && "page" in queryParams: //Search results paginated: localhost:3300/spare-parts?name=polt&page=2
      let searchData = searchByName(queryParams.name, data2);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(paginate(searchData.length, 30, queryParams.page, searchData)));
      break;
    case urlWithoutParams === "/spare-parts" && "page" in queryParams: //Paginate all results: localhost:3300/spare-parts?page=2
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(paginate(lines.length, 30, queryParams.page, data2)));
      break;
    case urlWithoutParams === "/spare-parts" && "name" in queryParams: //Search by name: localhost:3300/spare-parts?name=polt
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(searchByName(queryParams.name, data2)));
      break;
    case urlWithoutParams === "/spare-parts" && "sn" in queryParams: //Search by serial number: localhost:3300/spare-parts?sn=0066233042
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(searchBySerialNumber(queryParams.sn, data2)));
      break;
    case urlWithoutParams === "/spare-parts" && "sort" in queryParams: 
      let prices = data2;
      if(queryParams.sort === "price"){ // Ascending sorting by price: localhost:3300/spare-parts?sort=price
        sortAscending(prices);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(prices));
      }else if(queryParams.sort === "-price"){ // Descending sorting by price: localhost:3300/spare-parts?sort=-price
        sortDescending(prices);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(prices));
      }
    break;
    default : 
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify("Spare-parts API"));
      break;
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const sortAscending = (arr = []) => {
  const sorter = (a, b) => {
     return parseFloat(a.price) - parseFloat(b.price);
  };
  arr.sort(sorter);
};

const sortDescending = (arr = []) => {
  const sorter = (a, b) => {
    return parseFloat(b.price) - parseFloat(a.price);
  };
  arr.sort(sorter);
};

function searchByName(name, data){
  let result = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].name.includes(name))
      result.push(data[i]);
  }
  return result;
}

function searchBySerialNumber(serialNumber, data){
  let result = [];
  for(let i = 0; i < data.length; i++){
    if(data[i].serialNumber === serialNumber)
      result.push(data[i]);
  }
  return result;
}

function paginate(itemsTotal, itemsPerPage, pageNumber, data){
  let pageCount = Math.ceil(itemsTotal / itemsPerPage);
  let startIndex = (pageNumber - 1) * itemsPerPage;
  let endIndex = startIndex + itemsPerPage;
  let result = data.slice(startIndex, endIndex);
  return result;
}

function isUrlWithParams(url){
  let result;
  if(url.includes("?"))
    result = true;
  else
    result = false;
  return result;
}

function getUrlWithoutParams(url){
    let pureUrl = url.split("?");
    return pureUrl[0];
  }

function getQueryParams(url){
  if(!url.includes("?")){
    return;
  }
   let dataArray = url.split("?");
   dataArray.shift();
   dataArray = dataArray[0].split("&");
   let params = [];
   const obj = {};
   for(let i = 0; i < dataArray.length; i++){
    params = dataArray[i].split("=");
    const propName = params[0];
    obj[propName] = params[1];
    }
    return obj;
  }


// https://github.com/timotr/harjutused/tree/main/hajusrakendused

// Test data : 
// Base endpoint : localhost:3300/spare-parts
// Pagination : localhost:3300/spare-parts?page=2
// Search by name : localhost:3300/spare-parts?name=polt
// Search by serial number : localhost:3300/spare-parts?sn=0066233042
// Search result paginated : localhost:3300/spare-parts?name=polt&page=2
// Sorting by column name : localhost:3300/spare-parts?sort=price
// Sort in reverse order by adding - symbol in front of column name: localhost:3300/spare-parts?sort=-price
// Search by name, paginate and sort results localhost:3300/spare-parts?name=polt&page=2&sort=price
//                                           localhost:3300/spare-parts?name=polt&page=2&sort=-price
// Search by name and sort by price:         localhost:3300/spare-parts?name=polt&sort=price 
//                                           localhost:3300/spare-parts?name=polt&sort=-price
