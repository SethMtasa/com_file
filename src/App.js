import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./component/Home/Home";
import UserHome from "./component/Home/UserHome";
import Dashboard from "./component/Sidebar/Dashboard";
import SignInDetail from "./component/Auth/SignInDetail";
import Regions from "./component/File/Regions";
import ChannelPartners from "./component/File/ChannelPartners";
import Issues from "./component/File/Issues";
import Users from "./component/File/Users";
import LeaseReports from "./component/File/LeaseReports";
import Reports from "./component/File/Reports";
import UserReports from "./component/File/UserReports";
import Files from "./component/File/Files";
import NewFile from "./component/File/AddNewFile";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignInDetail />} />
            <Route path="user" element={<Dashboard />} >

                <Route path="/user/home" element={
                    <UserHome />
                } />

                <Route path="/user/user-reports" element={
                    <UserReports />
                } />


            </Route>
          <Route path="admin" element={<Dashboard />} >


          
            <Route path="/admin/home" element={
              
                 <Home />
             
              } />

              <Route path="/admin/add-new-file" element={

                  <NewFile />

              } />


              <Route path="/admin/regions" element={
              
                <Regions />
             
            } />
          
            <Route path="/admin/channel-partners" element={
             
                <ChannelPartners />
             
            } />

               <Route path="/admin/issues" element={
              
                <Issues />
             
            } />

             <Route path="/admin/files" element={
             
                <Files />
              
            } />


              <Route path="/admin/reports" element={

                  <Reports />

              } />


              <Route path="/admin/reports/leases" element={

                  <LeaseReports />

              } />


             <Route path="/admin/users" element={
             
                <Users />
              
            } />
                    

          </Route>



        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;