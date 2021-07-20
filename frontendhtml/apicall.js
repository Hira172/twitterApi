const loadDoc = async () =>  {
  document.getElementById("status").innerHTML = "Working on your request"
  var level0 = document.getElementById("name").value
   await fetch('//localhost:3000/'+level0)
  .then((response) => {
    console.log("response")
    return response.text();
  })
  .then((data) => {
    console.log(data)
    document.getElementById("status").innerHTML = data
  })
  .catch((error)=>{
    document.getElementById("status").innerHTML = error
  })
  
}