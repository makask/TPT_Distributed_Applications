const tasks = [
    {
        id: 1,
        name: 'Task 1',
        completed: false
    },
    {
        id: 2,
        name: 'Task 2',
        completed: true
    }
];

let lastTaskId = 1;
let lastTaskNumber = 1;
let taskList;
let addTask;
let bearerToken = localStorage.getItem("bearerToken");

// https://github.com/timotr/harjutused/blob/main/hajusrakendused/todo-client.md
// https://demo2.z-bit.ee/

// When the page is loaded in the browser, we add the first tasks to the page
window.addEventListener('load', () => {
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');
    userName = document.querySelector('#userName');
    password = document.querySelector('#password');
    loginForm = document.querySelector("#login");
    loginBtn = document.querySelector('#loginButton');
    loginError = document.querySelector('#login-error');
    registerError = document.querySelector('#register-error');
    userInfo = document.querySelector('#userInfo');
    logOutBtn = document.querySelector("#logOut");
    loggedUserName = document.querySelector("#loggedUserName");
    tasksContainer = document.querySelector("#tasksContainer");

    registerLink = document.querySelector("#register-new-user");
    registerForm = document.querySelector("#register-form");
    registerLoginBtn = document.querySelector("#register-login");
    regUserName = document.querySelector("#register-userName");
    regUserFirstName = document.querySelector("#register-firstName");
    regUserLastName = document.querySelector("#register-lastName");
    regPassword = document.querySelector("#register-password");
    reqBtn = document.querySelector("#registerButton");

    showUserData = document.querySelector("#userData");
    hideUserData = document.querySelector("#close-userData");

    changePassword = document.querySelector("#changePassword");
    saveNewPassword = document.querySelector("#save-new-pwd");
    canceNewPassword = document.querySelector("#cancel-save-new-pwd");
    newPassword = document.querySelector("#newPassword");

    if(bearerToken !== null){
        userInfo.classList.remove("hidden");
        loginForm.classList.add("hidden");
        tasksContainer.classList.remove("hidden");
        loggedUserName.innerHTML = localStorage.getItem("userName");
    }

    // Register link
    registerLink.addEventListener("click", ()=>{
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    })

    // Register => back to login form button
    registerLoginBtn.addEventListener("click", () => {
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        loginError.classList.add("hidden");
        registerError.classList.add("hidden");
    });

    // Register
    reqBtn.addEventListener("click", () => {
        if(regUserName.value === "" || 
        regUserFirstName.value === "" || 
        regUserLastName.value === "" || 
        regPassword.value === "" ){
            registerError.classList.remove("hidden");
        }else {
            registerError.classList.add("hidden");
            let newUser = {
                "username" : regUserName.value,
                "firstname" : regUserFirstName.value,
                "lastname" : regUserLastName.value,
                "newPassword" : regPassword.value
            }
            sendRequest("/users", "POST", newUser)
            .then((result) => {
                localStorage.setItem("bearerToken", result.access_token);
                localStorage.setItem("userName", result.firstname);
                localStorage.setItem("userId", result.id);
                bearerToken = localStorage.getItem("bearerToken");
                if(bearerToken !== "undefined"){
                    userInfo.classList.remove("hidden");
                    loginForm.classList.add("hidden");
                    registerForm.classList.add("hidden");
                    loggedUserName.innerHTML = localStorage.getItem("userName");
                    tasksContainer.classList.remove("hidden");
                    location.reload();
                }
            })
            .catch((error) => console.log("error", error));
        }      
    });
        
    // Login
    loginBtn.addEventListener("click", ()=>{
        sendRequest("/users/get-token", "POST", { "username" : userName.value, "password" : password.value })
        .then((result) => {
            localStorage.setItem("bearerToken", result.access_token);
            localStorage.setItem("userName", result.firstname);
            localStorage.setItem("userId", result.id);
            bearerToken = localStorage.getItem("bearerToken");
            if(bearerToken !== "undefined"){
                userInfo.classList.remove("hidden");
                loginForm.classList.add("hidden");
                loggedUserName.innerHTML = localStorage.getItem("userName");
                tasksContainer.classList.remove("hidden");
                location.reload();
            }else{
                loginError.classList.remove("hidden");
                localStorage.removeItem("bearerToken");
                localStorage.removeItem("userName");
                localStorage.removeItem("userId");
            }
        }).catch((error) => console.log("error", error));
    });

    // Logout 
    logOutBtn.addEventListener("click", () => {
        loginForm.classList.remove("hidden");
        userInfo.classList.add("hidden");
        loginError.classList.add("hidden");
        localStorage.removeItem("bearerToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        showUserData.classList.add("hidden");
        tasksContainer.classList.add("hidden");
        document.querySelector("#change-pwd-div").classList.add("hidden");
    }); 

    // GET all tasks
    if(localStorage.getItem("bearerToken")){
        getTasks();
    }
    
    // When the button is pressed, a new task is added
    addTask.addEventListener('click', () => {
        //const task = createTask(); // Let's first create a new task in the local "database".
        let task = { "title" : "New Task", "desc" : ""};
        addNewTask(task);
        lastTaskNumber++;
        const taskRow = createTaskRow(task); // Let's make a new task HTML element that can be added to the list on top of the page.
        taskList.appendChild(taskRow); // Add a task on the page.
    });

    // Show user info
    loggedUserName.addEventListener("click", ()=> {
        sendRequest(`/users/${localStorage.getItem("userId")}`, "GET")
        .then((result) => {
            showUserData.classList.remove("hidden");
            document.querySelector("#display-username").innerHTML = result.username;
            document.querySelector("#display-firstname").innerHTML = result.firstname;
            document.querySelector("#display-lastname").innerHTML = result.lastname;
            document.querySelector("#display-created-at").innerHTML = result.created_at;
            console.log(result);
   })
   .catch((error) => console.log("error", error)); 
    });
    
    // Hide user data
    hideUserData.addEventListener("click", () => {
        showUserData.classList.add("hidden");
        document.querySelector("#change-pwd-div").classList.add("hidden");
    });

    changePassword.addEventListener("click", () => {
        document.querySelector("#change-pwd-div").classList.remove("hidden");
    });

    // Save new password
    saveNewPassword.addEventListener("click", () => {
        updatePassword(localStorage.getItem("userId"), newPassword.value);
        document.querySelector("#change-pwd-div").classList.add("hidden");
    });

    canceNewPassword.addEventListener("click", () => {
        document.querySelector("#change-pwd-div").classList.add("hidden");
    });
});

function renderTask(task) {
    const taskRow = createTaskRow(task);
    taskList.appendChild(taskRow);
}

function createTask() {
    lastTaskId++;
    const task = {
        id: lastTaskId,
        name: 'Task ' + lastTaskId,
        completed: false
    };
    tasks.push(task);
    return task;
}

function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true);
    taskRow.removeAttribute('data-template');

    // We fill the form fields with data.
    const name = taskRow.querySelector("[name='name']");
    name.value = task.title;

    const checkbox = taskRow.querySelector("[name='completed']");
    checkbox.checked = task.marked_as_done;

    checkbox.checked ? task.marked_as_done : !task.marked_as_done;

    // PUT /tasks/{id} update task name
    name.addEventListener("keyup", ()=>{
        upDateTask(task.id, name.value, checkbox.checked);
    });

    // PUT /tasks/{id} update task completed
    checkbox.addEventListener("click", () => {
        upDateTask(task.id, name.value, checkbox.checked);
    });

    const deleteButton = taskRow.querySelector('.delete-task');

    // DELETE /tasks/{id}
    deleteButton.addEventListener('click', () => {
        taskList.removeChild(taskRow);
        tasks.splice(tasks.indexOf(task), 1);
        deleteTask(task.id);
    });

    // We prepare the checkbox for pressing.
    hydrateAntCheckboxes(taskRow);

    return taskRow;
}


function createAntCheckbox() {
    const checkbox = document.querySelector('[data-template="ant-checkbox"]').cloneNode(true);
    checkbox.removeAttribute('data-template');
    hydrateAntCheckboxes(checkbox);
    return checkbox;
}

/**
 * This function helps to add the necessary event listeners to the specially designed checkbox.
 * @param {HTMLElement} element A checkbox wrapper element or a container element that contains several checkboxes.
 */
function hydrateAntCheckboxes(element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper');
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // If the element has already been processed, skip it.
        if (wrapper.__hydrated)
            continue;
        wrapper.__hydrated = true;


        const checkbox = wrapper.querySelector('.ant-checkbox');

        // Let's check if the checkbox should already be checked, this is only for specially designed checkboxes.
        const input = wrapper.querySelector('.ant-checkbox-input');
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked');
        }
        
        // When a checkbox or label is clicked, the status of the checkbox is changed.
        wrapper.addEventListener('click', () => {
            input.checked = !input.checked;
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}

function sendRequest(address, method, data) {
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + bearerToken);

    let requestOptions = {
        method : method,
        headers : headers,
        redirect : "follow"
    }

    if(method !== "GET" && method !== "DELETE") {
        requestOptions.body = JSON.stringify(data);
    }

    return fetch("https://demo2.z-bit.ee" + address, requestOptions).then(
      (response) => {
        if (response.status !== 204) return response.json();
      }
    );
}

function getTasks(){
    sendRequest("/tasks", "GET")
    .then((result) => {
       result.forEach(renderTask);
    }).catch((error) => console.log("error", error))
}

function upDateTask(id, title, marked_as_done){
    sendRequest(`/tasks/${id}`, "PUT", { "title" : title, "marked_as_done" : marked_as_done })
    .then((result) => {
        console.log("Task updated:", result);
      })
    .catch((error) => console.log("error" , error));
}

function deleteTask(id){
    sendRequest(`/tasks/${id}`, "DELETE")
    .then((result) => {

    })
    .catch((error) => console.log("error" , error));
}

function addNewTask(task){
    sendRequest("/tasks", "POST", task).then((result) => {
        console.log("Task added:", result);
        location.reload();
    })
    .catch((error) => console.log("error" , error));
}

function updatePassword(id, newPassword){
    sendRequest(`/users/${id}`, "PUT", { "newPassword" : newPassword})
    .then((result) => {
        console.log("Password changed:", result);
      })
    .catch((error) => console.log("error" , error));
}


