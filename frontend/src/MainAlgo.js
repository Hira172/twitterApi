import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function MainAlgo (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [screenName, setScreenName] = useState();

    function handleSubmit(event) {
        axios.post( `/load2neo4j/all`, {screenName})
          .then(res => {
            setData(res.data)
                console.log(data)
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
        <Button variant="primary" onClick={handleSubmit}>
            Get data
        </Button>
        </Form>
    )
    else
        return(
            <p>Check logs</p>
        )
    
}



export default MainAlgo