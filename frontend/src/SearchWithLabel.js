import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function SearchWithLabel (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [erorFlag, setErorFlag] = useState();
    const [label, setlabel] = useState();

    function handleSubmit(event) {
        console.log(label)
        axios.get( `/getData/profile/label`, { params:{label}})
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
    else if(erorFlag == "true")
    return(<div>
        <Form >
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
        <p>{data}</p>
        </div>
    )
    else if(check=="true")
        return(
            <div>
        <Form >
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
        <Table striped bordered hover>
          <tbody>
            <tr>
              <th>ScreenName</th>
              <th>URL</th>
              <th> Name</th>
              <th>Created at</th>
              <th>Is ignore calc</th>
              <th>statusCount</th>
              <th>followingCount</th>
              <th>listedCount</th>
              <th>labels</th>
              <th>followerCount</th>
              <th>stored On</th>
            </tr>
            </tbody>
              { 
                data.map((item) => ( 
                  <tbody>
                    <tr>
                        <td>{item["screenName"]}</td>
                        <td>{item["url"]}</td>
                        <td>{item["name"]}</td>
                        <td>{item["createdAt"]}</td>
                        <td>{item["IsIgnoreCalc"]}</td>
                        <td>{item["statusCount"]}</td>
                        <td>{item["followingCount"]}</td>
                        <td>{item["listedCount"]}</td>
                        <td>{item["labels"]}</td>
                        <td>{item["storedOn"]}</td>
                        <td>{item["followerCount"]}</td>
                        
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
            
        )
}



export default SearchWithLabel