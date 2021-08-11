import Table from 'react-bootstrap/Table';
import axios from 'axios';
import React, { useState } from 'react';

function ProfileCountTable (){
    const [data, setData] = useState(0);
    const [check, setCheck] = useState(0);
        axios.get( `/allProfileCount`)
          .then(res => {
            setData(res.data)
            setCheck("true")
          })
        .catch(e=>{
            console.log(e)
        }) 

      console.log(check, data)
      if (check!=="true") {
        return <div>Loading ... </div>;
      } else {
        return (
          <div>
          <Table striped bordered hover>
          <tbody>
            <tr>
              <th>Label</th>
              <th>Count</th>
            </tr>
            </tbody>
              { 
                data.map((item) => (
                  <tbody>
                    <tr>
                        <td>{item.label}</td>
                        <td>{item.count}</td>
                        
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
        );
      }
  
}



export default ProfileCountTable