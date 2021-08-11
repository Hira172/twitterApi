import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import React, { useState } from 'react';
import axios from 'axios';

function UpdateProfile(){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [label, setlabel] = useState();
    const [screenName, setScreenName] = useState();
    function handleSubmit(event) {
        axios.post( `/updateProfile/add/label`, {screenName,label})
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
            <Form.Label>label</Form.Label>
            <Form.Control as="select" custom onChange={e => setlabel(e.target.value)}>
            <option value="6">Select Label</option>
          <option value="Level0">Level 0</option>
          <option value="Level1">Level 1</option>
          <option value="Level2">Level 2</option>
          <option value="IgnoreProcess">Ignore Process</option>
          <option value="IgnoreDiscover">Ignore Discover</option>
          <option value="IgnoreCalc">Ignore Calculations</option>
          <option value="IsProject">Is Project</option>
          <option value="IsEntity">Is Entity</option>
          <option value="IsPredictedProject">Is Predicted Project</option>
          <option value="IsPredictedEntity">Is Predicted Entity</option>
            </Form.Control>   
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
export default UpdateProfile