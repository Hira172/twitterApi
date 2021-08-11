import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function SearchWithTag (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [erorFlag, setErorFlag] = useState();
    const [tag, setTag] = useState();

    function handleSubmit(event) {
        console.log(tag)
        axios.get( `/getData/profile/Tag`, { params:{tag}})
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
            <Form.Label>tag</Form.Label>
            <Form.Control type="text" placeholder="Enter Tag" onChange={e => setTag(e.target.value)}/>
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
            <Form.Label>Tag</Form.Label>
            <Form.Control type="text" placeholder="Enter Tag" onChange={e => setTag(e.target.value)}/>
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
            <Form.Label>tag</Form.Label>
            <Form.Control type="text" placeholder="Enter tag" onChange={e => setTag(e.target.value)}/>
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
              <th>tags</th>
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
                        <td>{item["tags"]}</td>
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



export default SearchWithTag