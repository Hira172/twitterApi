import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';
import React, { useState } from 'react';
import axios from 'axios';

function AllProfiles (){
    const [data, setData] = useState();
    const [check, setCheck] = useState();
    const [erorFlag, setErorFlag] = useState();

        axios.get( `/getData/profile/Time?time=6`)
          .then(res => {
            setData(res.data)
            console.log(data)
            if(data == "No such user found"){
              setErorFlag("true")
              setCheck("false")
            }
            else
                setCheck("true")
          })
        .catch(e=>{
            console.log(e)
            setErorFlag("true")
        }) 


    if(erorFlag !== "true" && check !== "true")
    return(
        <p>loading</p>
    )
    else if(erorFlag == "true" && check !== "true"){
      return(<div>
        <p>{data}</p>
        </div>
    )
    }
    
    else if(check=="true" && erorFlag !== "true")
        return(
            <div>
        
        <Table striped bordered hover>
          <tbody>
            <tr>
            <th>labels</th>
            <th>screenName</th>
            <th>url</th>
            <th>name</th>
            <th>createdAt</th>
            <th>statusCount</th>
            <th>followingCount</th>
            <th>listedCount</th>
            <th>tags</th>
            <th>storedOn</th>
            <th>followerCount</th>
            <th>AA_Viral</th>
            <th>hidden</th>
            <th>DA_Viral</th>
            <th>reputation</th>
            <th>DA_Adoption</th>
            <th>accountAge</th>
            <th>DA_Hotness</th>
            <th>AA_Hotness</th>
            <th>mutualCount</th>
            <th>AA_Adoption</th>
            <th>discoveredAge</th>
            <th>TS_Viral</th>
            <th>AA_Gem</th>
            <th>TS_Adoption</th>
            <th>TS_Hotness</th>
            </tr>
            </tbody>
              { 
                data.map((item) => ( 
                  <tbody>
                    <tr>
                    <td>{item["labels"]}</td>
                        <td>{item["screenName"]}</td>
                        <td>{item["url"]}</td>
                        <td>{item["name"]}</td>
                        <td>{item["createdAt"]}</td>
                        <td>{item["statusCount"]}</td>
                        <td>{item["followingCount"]}</td>
                        <td>{item["listedCount"]}</td>
                        <td>{item["tags"]}</td>
                        <td>{item["storedOn"]}</td>
                        <td>{item["followerCount"]}</td>
                        <td>{item["AA_Viral"]}</td>
                        <td>{item["hidden"]}</td>
                        <td>{item["DA_Viral"]}</td>
                        <td>{item["reputation"]}</td>
                        <td>{item["DA_Adoption"]}</td>
                        <td>{item["accountAge"]}</td>
                        <td>{item["DA_Hotness"]}</td>
                        <td>{item["AA_Hotness"]}</td>
                        <td>{item["mutualCount"]}</td>
                        <td>{item["AA_Adoption"]}</td>
                        <td>{item["discoveredAge"]}</td>
                        <td>{item["TS_Viral"]}</td>
                        <td>{item["AA_Gem"]}</td>
                        <td>{item["TS_Adoption"]}</td>
                        <td>{item["TS_Hotness"]}</td>
                    </tr>
                    </tbody>
                ))
              }
              
          </Table>
        </div>
            
        )
        
}



export default AllProfiles