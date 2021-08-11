import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function SearchWithScore (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [erorFlag, setErorFlag] = useState();
    const [score, setscore] = useState();
    const [time, setTime] = useState();

    function handleSubmit(event) {
        console.log(time)
        axios.get( `/getData/profile/specificScore`, { params:{score, time}})
          .then(res => {
            setData(res.data)
            console.log(data)
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
            <Form.Label>Specific Score </Form.Label>
            <Form.Control type="text" placeholder="Enter Specific Score " onChange={e => setscore(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Time</Form.Label>
            <Form.Control as="select" custom onChange={e => {setTime(e.target.value)}} >
            <option value="6">Select Time</option>
          <option value="12">12 hrs</option>
          <option value="24">1 day</option>
          <option value="72">3 days</option>
          <option value="168">7 days</option>
          <option value="730">1 month</option>
          <option value="2190">3 month</option>
          <option value="8760">1 year</option>
            </Form.Control>    
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
    )
    else if(check=="true")
        return(
            <div>
        <Form >
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Specific Score </Form.Label>
            <Form.Control type="text" placeholder="Enter Specific Score " onChange={e => setscore(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Time</Form.Label>
            <Form.Control as="select" custom onChange={e => setTime(e.target.value)} >
            <option value="6">Select Time</option>
          <option value="6">6 hrs</option>
          <option value="12">12 hrs</option>
          <option value="24">1 day</option>
          <option value="72">3 days</option>
          <option value="168">7 days</option>
          <option value="730">1 month</option>
          <option value="2190">3 month</option>
          <option value="8760">1 year</option>
            </Form.Control>    
        </Form.Group>
        <Button variant="primary" onClick={handleSubmit}>
            Find
        </Button>
        </Form>
        <Table striped bordered hover>
          <tbody>
            <tr>
            <th>labels</th>
            <th>url</th>
            <th>name</th>
            <th>createdAt</th>
            <th>statusCount</th>
            <th>followingCount</th>
            <th>listedCount</th>
            <th>tags</th>
            <th>storedOn</th>
            <th>followerCount</th>
            <th>current</th>
            <th>change</th>
            
            </tr>
            </tbody>
              { 
                data.map((item) => ( 
                  <tbody>
                    <tr>
                        <td>{item["labels"]}</td>
                        <td>{item["url"]}</td>
                        <td>{item["name"]}</td>
                        <td>{item["createdAt"]}</td>
                        <td>{item["statusCount"]}</td>
                        <td>{item["followingCount"]}</td>
                        <td>{item["listedCount"]}</td>
                        <td>{item["tags"]}</td>
                        <td>{item["storedOn"]}</td>
                        <td>{item["followerCount"]}</td>
                        <td>{item["current"]}</td>
                        <td>{item["change"]}</td>
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
            
        )
}



export default SearchWithScore