import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import React, { useState } from 'react';
import axios from 'axios';

function AddApiKey (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [consumerKey, setconsumerKey] = useState();
    const [consumerSecret, setconsumerSecret] = useState();
    const [accessKey, setaccessKey] = useState();
    const [accessSecret, setaccessSecret] = useState();

    function handleSubmit(event) {
        axios.post( `/create/apikey`, {consumerKey,consumerSecret,accessKey,accessSecret})
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
            <Form.Label>Consumer Key</Form.Label>
            <Form.Control type="text"  onChange={e => setconsumerKey(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Consumer Secret Key</Form.Label>
            <Form.Control type="text"  onChange={e => setconsumerSecret(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Access Key</Form.Label>
            <Form.Control type="text"  onChange={e => setaccessKey(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Access Secret Key</Form.Label>
            <Form.Control type="text"  onChange={e => setaccessSecret(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Add
        </Button>
        </Form>
    )
    else
        return(
            <p>{data}</p>
        )
    
}



export default AddApiKey