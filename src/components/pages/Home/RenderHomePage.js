import React, { useState, useEffect } from 'react';
import CaseTable from '../CaseTable/CaseTable';
import JudgeTable from '../JudgeTable/JudgeTable';
import { UploadCase } from '../Upload/UploadCase';
import SideDrawer from '../SideDrawer/SideDrawer';
import JudgePage from '../JudgePage/JudgePage';
import CaseOverview from '../CaseOverview/CaseOverview';
import { Route } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';

import axios from 'axios';
import SavedCases from '../SavedCases/SavedCases';
import SavedJudges from '../SavedJudges/SavedJudges';

// Imports for loading spinner
import { trackPromise } from 'react-promise-tracker';
import { usePromiseTracker } from 'react-promise-tracker';
import Loader from 'react-promise-loader';
import CaseUpdate from '../CaseOverview/CaseUpdate';

const useStyles = makeStyles({
  container: {
    display: 'flex',
  },
});

function RenderHomePage(props) {
  const { userInfo, authService, authState, uploadCase } = props;
  const [caseData, setCaseData] = useState([]);
  const [judgeData, setJudgeData] = useState([]);
  const [savedCases, setSavedCases] = useState([]);
  const [showCaseTable, setShowCaseTable] = useState(true);
  const [savedJudges, setSavedJudges] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});

  // should move these API calls into a separate index folder at some point

  useEffect(() => {
    // trackPromise(
    // Tracks the axios call and implements spinning loader while executing
    axios
      .get(`${process.env.REACT_APP_API_URI}/cases`, {
        headers: {
          Authorization: 'Bearer ' + authState.idToken,
        },
      })
      // )
      .then(res => {
        setCaseData(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    trackPromise(
      // Tracks the axios call and implements spinning loader while executing
      axios.get(`${process.env.REACT_APP_API_URI}/judge`, {
        headers: {
          Authorization: 'Bearer ' + authState.idToken,
        },
      })
    )
      .then(res => {
        setJudgeData(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    trackPromise(
      axios.get(`${process.env.REACT_APP_API_URI}/profile/${userInfo.sub}`, {
        headers: {
          Authorization: 'Bearer ' + authState.idToken,
        },
      })
    )
      .then(res => {
        setSavedCases(res.data.case_bookmarks);
        setSavedJudges(res.data.judge_bookmarks);
      })
      .catch(err => {
        console.log(err);
      });
  }, [authState.idToken, userInfo.sub, savedCases.length, savedJudges.length]);

  const deleteFromStateById = (id, state, setState) => {
    // i made this function non case specific but now I'm remembering that cases get deleted by name
    let index = state.findIndex(item => item.id === id);
    return setState(state.slice(0, index).concat(state.slice(index + 1)));
  };

  const deleteBookmark = caseID => {
    // only works for cases, judge requires name instead of ID to delete
    axios
      .delete(
        `${process.env.REACT_APP_API_URI}/profile/${userInfo.sub}/case/${caseID}`,
        {
          headers: {
            Authorization: 'Bearer ' + authState.idToken,
          },
        }
      )
      .then(res => {
        deleteFromStateById(caseID, savedCases, setSavedCases);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const deleteFromStateByName = (name, state, setState) => {
    let index = state.findIndex(item => item.judge_name === name);
    return setState(state.slice(0, index).concat(state.slice(index + 1)));
  };

  const formatJudgeName = name => {
    // Used in order to format the judge so it can be used in the API call
    return name.split(' ').join('%20');
  };

  const deleteSavedJudge = name => {
    axios
      .delete(
        `${process.env.REACT_APP_API_URI}/profile/${
          userInfo.sub
        }/judge/${formatJudgeName(name)}`,
        {
          headers: {
            Authorization: 'Bearer ' + authState.idToken,
          },
        }
      )
      .then(res => {
        deleteFromStateByName(name, savedJudges, setSavedJudges);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const logout = () => authService.logout;
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <SideDrawer
        logout={logout}
        userInfo={userInfo}
        uploadCase={uploadCase}
        savedCases={savedCases}
        savedJudges={savedJudges}
        deleteBookmark={deleteBookmark}
        deleteSavedJudge={deleteSavedJudge}
      />

      <Route exact path="/upload-case">
        <UploadCase uploadCase={uploadCase} />
      </Route>
      <Route exact path="/saved-cases">
        <SavedCases savedCases={savedCases} deleteBookmark={deleteBookmark} />
      </Route>
      <Route exact path="/saved-judges">
        <SavedJudges
          savedJudges={savedJudges}
          deleteSavedJudge={deleteSavedJudge}
        />
      </Route>
      <Route exact path="/judge/:name">
        <JudgePage
          // clicking on a judge name should bring you to a url with their name in it
          // get request to get details of that judge
          authState={authState}
        />
      </Route>
      <Route exact path="/case/:id" authState={authState}>
        {/* clicking on a case name will bring you to a page where more indepth information
      about the case can be viewed, this page is linked to the cooresponding judge's page
      this page also links to the update case file which is not operational yet, see notation
      on CaseOverview & CaseUpdate for details */}
        <CaseOverview />
      </Route>
      <Route exact path="case/:id/update" authState={authState}>
        <CaseUpdate />
      </Route>

      <Route exact path="/">
        {/* showCaseTable is a boolean when true will display the Cases Table and when false will dispaly the Judges Table */}
        {showCaseTable && (
          <>
            <CaseTable
              showCaseTable={showCaseTable}
              setShowCaseTable={setShowCaseTable}
              caseData={caseData}
              userInfo={userInfo}
              savedCases={savedCases}
              setSavedCases={setSavedCases}
              authState={authState}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
            />
            <Loader promiseTracker={usePromiseTracker} />
          </>
        )}
        {!showCaseTable && (
          <>
            <JudgeTable
              showCaseTable={showCaseTable}
              setShowCaseTable={setShowCaseTable}
              judgeData={judgeData}
              userInfo={userInfo}
              savedJudges={savedJudges}
              setSavedJudges={setSavedJudges}
              authState={authState}
            />
            <Loader promiseTracker={usePromiseTracker} />
          </>
        )}
      </Route>
    </div>
  );
}
export default RenderHomePage;
