# RaceTracker Pro — User Guide

> This guide is auto-generated from the Playwright journey tests.
> Screenshots show the actual app at each key step.
> Regenerate with: `npm run generate:guide`

## Split-Role Checkpoint Operations

How two operators can share one checkpoint — a Marker records runner times and shares batches via QR code, while a Radio Operator scans the QR and calls runners in to base.

### Checkpoint opens in Marker mode by default



**Navigate to checkpoint 1**

![Navigate to checkpoint 1](assets/checkpoint-opens-in-marker-mode-by-default-step-01.jpg)

**Role toggle is visible with Marker and Radio Operator buttons**

![Role toggle is visible with Marker and Radio Operator buttons](assets/checkpoint-opens-in-marker-mode-by-default-step-02.jpg)

**Marker mode — runner grid is visible**

![Marker mode — runner grid is visible](assets/checkpoint-opens-in-marker-mode-by-default-step-03.jpg)

### Switching to Radio Operator mode replaces the runner grid with a scan zone



**Navigate to checkpoint 1 in default Marker mode**

![Navigate to checkpoint 1 in default Marker mode](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-01.jpg)

**Click Radio Operator toggle button**

![Click Radio Operator toggle button](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-02.jpg)

**Radio Operator mode — scan zone is visible with Scan QR button**

![Radio Operator mode — scan zone is visible with Scan QR button](assets/switching-to-radio-operator-mode-replaces-the-runner-grid-with-a-scan-zone-step-03.jpg)

### Switching back to Marker mode restores the runner grid



**Navigate to checkpoint 1 and switch to Radio Operator**

![Navigate to checkpoint 1 and switch to Radio Operator](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-01.jpg)

**Click Marker toggle to switch back**

![Click Marker toggle to switch back](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-02.jpg)

**Marker mode — runner grid tabs are restored**

![Marker mode — runner grid tabs are restored](assets/switching-back-to-marker-mode-restores-the-runner-grid-step-03.jpg)

### Share Batch button is visible in Marker mode with a QR icon



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-button-is-visible-in-marker-mode-with-a-qr-icon-step-01.jpg)

**Share Batch FAB is visible with QR icon**

![Share Batch FAB is visible with QR icon](assets/share-batch-button-is-visible-in-marker-mode-with-a-qr-icon-step-02.jpg)

### Share Batch button is hidden in Radio Operator mode



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-01.jpg)

**Switch to Radio Operator mode**

![Switch to Radio Operator mode](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-02.jpg)

**Share Batch button is no longer visible**

![Share Batch button is no longer visible](assets/share-batch-button-is-hidden-in-radio-operator-mode-step-03.jpg)

### Share Batch opens the batch share modal



**Navigate to checkpoint 1 in Marker mode**

![Navigate to checkpoint 1 in Marker mode](assets/share-batch-opens-the-batch-share-modal-step-01.jpg)

**Click Share Batch button**

![Click Share Batch button](assets/share-batch-opens-the-batch-share-modal-step-02.jpg)

**Batch share modal appears with Share Batch heading**

![Batch share modal appears with Share Batch heading](assets/share-batch-opens-the-batch-share-modal-step-03.jpg)
