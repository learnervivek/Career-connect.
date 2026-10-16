import { createSlice } from "@reduxjs/toolkit";

const interviewSlice = createSlice({
    name: "interview",
    initialState: {
        recruiterInterviews: [],
        candidateInterviews: [],
        selectedInterview: null,
        loading: false,
    },
    reducers: {
        setRecruiterInterviews: (state, action) => {
            state.recruiterInterviews = action.payload;
        },
        setCandidateInterviews: (state, action) => {
            state.candidateInterviews = action.payload;
        },
        setSelectedInterview: (state, action) => {
            state.selectedInterview = action.payload;
        },
        setInterviewLoading: (state, action) => {
            state.loading = action.payload;
        },
    }
});

export const {
    setRecruiterInterviews,
    setCandidateInterviews,
    setSelectedInterview,
    setInterviewLoading,
} = interviewSlice.actions;

export default interviewSlice.reducer;
