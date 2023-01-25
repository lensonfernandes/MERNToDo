const config = {
  "content-type": "application/json",
};
// console.log("Hello from browser")

document.addEventListener("click", function (event) {

 
  if (event.target.classList.contains("add_item")) {
    event.preventDefault();

    const todoText = document.getElementById("create_field");

    if(todoText.value === ''){
      alert("Please engter todo text");
      return ;
    }

    axios.post('/create-item', {todo:todoText.value}).then(res=>{
      if(res.data.status !== 201){
        alert(res.data.message);
        return;
      }
    }).catch(err=>{
      console.log(err)
      alert(err)
    })
  }


  if (event.target.classList.contains("edit-me")) {
    //id
    //newData
    const id = event.target.getAttribute("data-id");
    const newData = prompt("Enter new todo");
    console.log(id, newData);
    axios
      .post("/edit-item", { id, newData }, config)
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        event.target.parentElement.parentElement.querySelector(
          ".item-text"
        ).innerHTML = newData;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }

  if (event.target.classList.contains("delete-me")) {
    console.log("Delete clicked");

    const id = event.target.getAttribute("data-id");
    console.log(id);
    axios
      .post("/delete-item", { id })
      .then((res) => {

        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        //deleting todo
        event.target.parentElement.parentElement.remove();
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }
});


document.getElementById("item_list").insertAdjacentHTML("beforeend", todos.map((item)=>{
  return `<li
  class="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
>
  <span class="item-text"> ${item.todo}</span>
  <div>
    <button
      data-id="<${item._id}>"
      class="edit-me btn btn-secondary btn-sm mr-1"
    >
      Edit</button
    ><button
      data-id="<${item._id}>"
      class="delete-me btn btn-danger btn-sm"
    >
      Delete
    </button>
  </div>
</li>`
}).join(""))