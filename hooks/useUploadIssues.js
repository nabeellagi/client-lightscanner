"use client";

import { useCallback, useState } from "react";

let issueUid = 0;
const nextIssueId = () => `issue_${Date.now()}_${issueUid++}`;

export function useUploadIssues() {
  const [issues, setIssues] = useState([]);

  const pushIssue = useCallback((type, message) => {
    setIssues((prev) => [...prev, { id: nextIssueId(), type, message }]);
  }, []);

  const dismissIssue = useCallback((id) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
  }, []);

  return { issues, pushIssue, dismissIssue };
}