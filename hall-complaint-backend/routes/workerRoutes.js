const express = require("express");
const workers = require("../workers");

const router = express.Router();

const normalize = (value) => String(value || "").trim().toLowerCase();

// GET ALL WORKERS
router.get("/", (req, res) => {
  try {
    const hall = req.query.hall || "";
    const type = req.query.type || "";

    let filteredWorkers = [...workers];

    if (hall) {
      filteredWorkers = filteredWorkers.filter(
        (worker) => normalize(worker.hall) === normalize(hall)
      );
    }

    if (type) {
      filteredWorkers = filteredWorkers.filter(
        (worker) => normalize(worker.type) === normalize(type)
      );
    }

    return res.status(200).json({
      success: true,
      count: filteredWorkers.length,
      workers: filteredWorkers,
    });
  } catch (error) {
    console.error("Worker route error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET SINGLE WORKER BY ID
router.get("/:workerId", (req, res) => {
  try {
    const worker = workers.find(
      (item) => String(item.workerId) === String(req.params.workerId)
    );

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    return res.status(200).json({
      success: true,
      worker,
    });
  } catch (error) {
    console.error("Single worker route error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;