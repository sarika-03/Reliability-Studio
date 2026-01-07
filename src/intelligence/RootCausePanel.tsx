import React from 'react';

export const RootCausePanel = ({ cause }: { cause: string }) => (
  <div>
    <h4>Root Cause</h4>
    <p>{cause}</p>
  </div>
);
