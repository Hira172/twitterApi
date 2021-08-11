import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function SignleProfile (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [erorFlag, setErorFlag] = useState();
    const [screenName, setScreenName] = useState();

    function handleSubmit(event) {
        axios.get( `/getData/profile`, { params:{screenName}})
          .then(res => {
            setData(res.data)
            if(data== "No such user found")
                setErorFlag("true")
            else
                setCheck("true")
          })
        .catch(e=>{
            console.log(e)
            setErorFlag("true")
        }) 

      }
    if(erorFlag !== "true" && check !== "true")
    return(
        <Form >
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Screen Name</Form.Label>
            <Form.Control type="text" placeholder="Enter screen name" onChange={e => setScreenName(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
    )
    else if(erorFlag == "true")
    return(<div>
        <Form >
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Screen Name</Form.Label>
            <Form.Control type="text" placeholder="Enter screen name" onChange={e => setScreenName(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
        <p>{data}</p>
        </div>
    )
    else if(check=="true")
        return(
            <div>
        <Form >
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Screen Name</Form.Label>
            <Form.Control type="text" placeholder="Enter screen name" onChange={e => setScreenName(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
        <Table striped bordered hover>
          <tbody>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
            </tbody>
              { 
                data.map((item) => ( 
                  <tbody>
                    <tr>
                        <td>{item["label"]}</td>
                        <td>{item["value"]}</td>
                        
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
            
        )
}



export default SignleProfile