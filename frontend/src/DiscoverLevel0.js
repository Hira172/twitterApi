import Table from 'react-bootstrap/Table';
import axios from 'axios';
import React, { useState } from 'react';

function DiscoverLevel0 (){
    const [data, setData] = useState(0);
    const [check, setCheck] = useState(0);
        axios.get( `/discover/level0`)
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
              <th>Screen Names</th>
            </tr>
            </tbody>
              { 
                data.map((item) => (
                  <tbody>
                    <tr>
                        <td>{item}</td>
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
        );
      }
  
}



export default DiscoverLevel0