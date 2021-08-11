import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import React, { useState } from 'react';
import axios from 'axios';

function UpdateProfileTag(){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [tag, setTag] = useState();
    const [screenName, setScreenName] = useState();
    function handleSubmit(event) {
        axios.post( `/updateProfile/add/tag`, {screenName,tag})
          .then(res => {
            setData(res.data)

                setCheck("true")
          })
        .catch(e=>{
            console.log(e)
        }) 

      }
      if( check !== "true")
      return(
        <Form >
            <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Screen Name</Form.Label>
            <Form.Control type="text" placeholder="Enter screen name" onChange={e => setScreenName(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Tag</Form.Label>
            <Form.Control type="text" placeholder="Enter Tag" onChange={e => setTag(e.target.value)}/>
        </Form.Group>
        
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
    )
    else
    return(
        <p>{data}</p>
    )
}
export default UpdateProfileTag