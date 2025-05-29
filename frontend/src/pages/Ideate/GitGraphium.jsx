"use client"

import { useState, useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer"

// Debug overlay utility for VR troubleshooting
const debugOverlay = {
  element: null,
  messages: [],
  init: function () {
    if (this.element) return

    const overlay = document.createElement("div")
    overlay.style.position = "fixed"
    overlay.style.bottom = "120px"
    overlay.style.left = "10px"
    overlay.style.right = "10px"
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
    overlay.style.color = "#fff"
    overlay.style.padding = "10px"
    overlay.style.borderRadius = "5px"
    overlay.style.fontFamily = "monospace"
    overlay.style.fontSize = "12px"
    overlay.style.zIndex = "10000"
    overlay.style.maxHeight = "150px"
    overlay.style.overflowY = "auto"
    overlay.style.pointerEvents = "none" // Ensure it doesn't block interactions

    document.body.appendChild(overlay)
    this.element = overlay
  },
  log: function (message) {
    console.log("VR Debug:", message)
    this.messages.push(new Date().toLocaleTimeString() + ": " + message)
    if (this.messages.length > 10) this.messages.shift()

    if (!this.element) this.init()
    this.element.innerHTML = this.messages.join("<br>")
  },
  clear: function () {
    this.messages = []
    if (this.element) this.element.innerHTML = ""
  },
  show: function () {
    if (!this.element) this.init()
    this.element.style.display = "block"
  },
  hide: function () {
    if (this.element) this.element.style.display = "none"
  },
}

// VR status indicator component
const VRStatusIndicator = ({ isVisible, message }) => {
  if (!isVisible) return null

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        padding: "15px 20px",
        borderRadius: "10px",
        zIndex: 10000,
        pointerEvents: "none",
        textAlign: "center",
        maxWidth: "80%",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: "0 auto", display: "block" }}
        >
          <path d="M2 8l4 2 4-2-4-2-4 2"></path>
          <path d="M14 8l4 2 4-2-4-2-4 2"></path>
          <path d="M2 14l4 2 4-2-4-2-4 2"></path>
          <path d="M14 14l4 2 4-2-4-2-4 2"></path>
          <path d="M8 6l4 2 4-2-4-2-4 2"></path>
          <path d="M8 18l4 2 4-2-4-2-4 2"></path>
        </svg>
      </div>
      <p>{message}</p>
    </div>
  )
}

const GithubRepoVisualizer = () => {
  const [repoUrl, setRepoUrl] = useState("")
  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [fileSummary, setFileSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [showGithubTokenInput, setShowGithubTokenInput] = useState(false)
  const [repoInfo, setRepoInfo] = useState({ owner: "", repo: "", defaultBranch: "main" })
  const [isVRMode, setIsVRMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [vrStatus, setVrStatus] = useState({ visible: false, message: "" })
  const [vrInfoPanel, setVrInfoPanel] = useState(null)

  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const labelRendererRef = useRef(null)
  const vrButtonRef = useRef(null)
  const xrSessionRef = useRef(null)
  const vrObjectRef = useRef(null)
  const vrControllerRef = useRef(null)
  const vrControllerGripRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const intersectedRef = useRef(null)

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Check WebXR support on component mount
  useEffect(() => {
    const checkVRSupport = async () => {
      if (!navigator.xr) {
        console.log("WebXR not supported in this browser")
        return false
      }

      try {
        const isSupported = await navigator.xr.isSessionSupported("immersive-vr")
        console.log("VR supported:", isSupported)
        return isSupported
      } catch (err) {
        console.error("Error checking VR support:", err)
        return false
      }
    }

    checkVRSupport()
  }, [])

  // Add a useEffect to ensure the VR button is created even if the scene hasn't been initialized yet
  useEffect(() => {
    // Create VR button if repository data is loaded but VR button doesn't exist
    if (repoData && !vrButtonRef.current && containerRef.current) {
      // Check for WebXR support
      if (navigator.xr) {
        navigator.xr
          .isSessionSupported("immersive-vr")
          .then((supported) => {
            if (supported) {
              // Create VR button
              const vrButton = document.createElement("button")
              vrButton.id = "vr-button" // Add ID for easier debugging
              vrButton.className = "vr-button"
              vrButton.textContent = "Enter VR"
              vrButton.style.position = "fixed" // Change to fixed positioning
              vrButton.style.bottom = isMobile ? "20px" : "80px"
              vrButton.style.left = isMobile ? "50%" : "30px" // Center on mobile
              vrButton.style.transform = isMobile ? "translateX(-50%)" : "none" // Center on mobile
              vrButton.style.padding = "12px 20px"
              vrButton.style.border = "none"
              vrButton.style.borderRadius = "30px"
              vrButton.style.backgroundColor = "#4CAF50"
              vrButton.style.color = "white"
              vrButton.style.fontWeight = "bold"
              vrButton.style.fontSize = isMobile ? "16px" : "16px" // Slightly larger on mobile
              vrButton.style.cursor = "pointer"
              vrButton.style.zIndex = "9999" // Ensure it's above everything
              vrButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)"
              vrButton.style.display = "flex"
              vrButton.style.alignItems = "center"
              vrButton.style.justifyContent = "center"
              vrButton.style.width = isMobile ? "160px" : "auto" // Fixed width on mobile

              // Add VR icon
              const vrIcon = document.createElement("span")
              vrIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin-right: 8px;">
                  <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M10 9v6"></path>
                  <path d="M14 9v6"></path>
                </svg>
              `
              vrButton.prepend(vrIcon)

              // Add click event
              vrButton.addEventListener("click", startVRSession)

              // Append to body instead of container for better visibility
              document.body.appendChild(vrButton)
              vrButtonRef.current = vrButton
            }
          })
          .catch((err) => {
            console.error("Error checking VR support:", err)
          })
      }
    }

    // Cleanup function
    return () => {
      if (vrButtonRef.current) {
        vrButtonRef.current.remove()
        vrButtonRef.current = null
      }
    }
  }, [repoData, isMobile, isVRMode])

  // Function to start VR session
  const startVRSession = () => {
    if (!isVRMode) {
      // Enter VR mode
      debugOverlay.clear()
      debugOverlay.show()
      debugOverlay.log("Starting VR session...")
      setVrStatus({ visible: true, message: "Initializing VR..." })

      // Set up session
      const sessionInit = {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"],
      }

      navigator.xr
        .requestSession("immersive-vr", sessionInit)
        .then((session) => {
          debugOverlay.log("VR session created successfully")
          xrSessionRef.current = session

          // Make sure the renderer is properly configured for VR
          rendererRef.current.xr.enabled = true
          rendererRef.current.xr.setReferenceSpaceType("local")
          rendererRef.current.xr.setSession(session)

          // Setup VR controllers
          setupVRControllers(session)

          // Change background for VR
          sceneRef.current.background = new THREE.Color(0x000000)

          // Make all nodes more visible in VR
          sceneRef.current.traverse((object) => {
            if (object.isNode) {
              // Increase emissive intensity for better visibility in VR
              object.material.emissiveIntensity = 0.8

              // Make labels larger, more visible, and ensure they're enabled for VR
              if (object.children[0] && object.children[0].element) {
                // Enhance label visibility
                object.children[0].element.style.fontSize = "16px"
                object.children[0].element.style.backgroundColor = `rgba(${hexToRgb(
                  object.userData.originalColor,
                )}, 0.9)`
                object.children[0].element.style.padding = "6px 10px"
                object.children[0].element.style.fontWeight = "bold"
                object.children[0].element.style.color = "#ffffff"
                object.children[0].element.style.textShadow = "0px 0px 3px #000000"

                // Make sure label is visible
                object.children[0].visible = true
                object.children[0].element.style.display = "block"

                // Scale up the label for better visibility in VR
                object.children[0].scale.set(1.5, 1.5, 1.5)
              }
            }
          })

          // Update button text
          if (vrButtonRef.current) {
            vrButtonRef.current.textContent = "Exit VR"
          }
          setIsVRMode(true)
          setVrStatus({ visible: false, message: "" })

          // Handle VR session end
          session.addEventListener("end", handleVRSessionEnd)
        })
        .catch((error) => {
          console.error("Error starting VR session:", error)
          debugOverlay.log(`Error starting VR: ${error.message}`)
          setVrStatus({ visible: true, message: `VR error: ${error.message}. Try restarting your browser.` })

          // Show error message to user
          const errorMsg = document.createElement("div")
          errorMsg.style.position = "fixed"
          errorMsg.style.bottom = "80px"
          errorMsg.style.left = "50%"
          errorMsg.style.transform = "translateX(-50%)"
          errorMsg.style.backgroundColor = "rgba(255, 0, 0, 0.8)"
          errorMsg.style.color = "white"
          errorMsg.style.padding = "10px"
          errorMsg.style.borderRadius = "5px"
          errorMsg.style.zIndex = "10000"
          errorMsg.textContent = "Could not start VR session. Make sure you're using a compatible device and browser."
          document.body.appendChild(errorMsg)
          setTimeout(() => {
            errorMsg.remove()
            debugOverlay.hide()
            setVrStatus({ visible: false, message: "" })
          }, 3000)
        })
    } else if (isVRMode && rendererRef.current && xrSessionRef.current) {
      // Exit VR mode
      debugOverlay.log("Ending VR session...")
      xrSessionRef.current.end()
    }
  }

  // Setup VR controllers
  const setupVRControllers = (session) => {
    // Controller models
    const controllerModelFactory = new THREE.XRControllerModelFactory()

    // Controller 1
    const controller1 = rendererRef.current.xr.getController(0)
    controller1.addEventListener("selectstart", onSelectStart)
    controller1.addEventListener("selectend", onSelectEnd)
    sceneRef.current.add(controller1)

    // Controller 2
    const controller2 = rendererRef.current.xr.getController(1)
    controller2.addEventListener("selectstart", onSelectStart)
    controller2.addEventListener("selectend", onSelectEnd)
    sceneRef.current.add(controller2)

    // Controller grips for showing controller models
    const controllerGrip1 = rendererRef.current.xr.getControllerGrip(0)
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1))
    sceneRef.current.add(controllerGrip1)

    const controllerGrip2 = rendererRef.current.xr.getControllerGrip(1)
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2))
    sceneRef.current.add(controllerGrip2)

    // Line for controller pointing
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)])

    const line = new THREE.Line(geometry)
    line.scale.z = 5

    controller1.add(line.clone())
    controller2.add(line.clone())

    vrControllerRef.current = controller1
    vrControllerGripRef.current = controllerGrip1
  }

  // Handle controller select start
  const onSelectStart = (event) => {
    const controller = event.target

    // Create a ray from the controller
    const tempMatrix = new THREE.Matrix4()
    tempMatrix.identity().extractRotation(controller.matrixWorld)

    raycasterRef.current.ray.origin.setFromMatrixPosition(controller.matrixWorld)
    raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

    // Check for intersections with nodes
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)

    if (intersects.length > 0) {
      const object = intersects[0].object
      if (object.isNode) {
        // Handle node selection
        if (selectedNode) {
          selectedNode.material.emissiveIntensity = 0.2
          selectedNode.scale.copy(selectedNode.userData.originalScale)

          // Hide connected lines
          sceneRef.current.children.forEach((child) => {
            if (
              child.isLine &&
              (child.userData.startNode === selectedNode || child.userData.endNode === selectedNode)
            ) {
              child.material.opacity = 0.3
            }
          })
        }

        // Select new node
        setSelectedNode(object)
        object.material.emissiveIntensity = 0.8
        object.scale.set(
          object.userData.originalScale.x * 1.5,
          object.userData.originalScale.y * 1.5,
          object.userData.originalScale.z * 1.5,
        )

        // Highlight connected lines
        sceneRef.current.children.forEach((child) => {
          if (child.isLine && (child.userData.startNode === object || child.userData.endNode === object)) {
            child.material.opacity = 1
          }
        })

        // Get file content and summary for VR info panel
        if (isVRMode) {
          // Show a temporary panel while loading
          createVRInfoPanel(object, "Loading information...")

          // Fetch the actual data
          ;(async () => {
            const nodeName = object.userData.name
            const nodePath = object.userData.path
            const isDirectory = object.userData.isDirectory
            const isRoot = object.userData.isRoot

            let summaryText = ""

            if (isRoot) {
              summaryText = "This is the root directory of the repository."
            } else if (nodeName === "node_modules") {
              summaryText = "This directory contains all the dependencies installed by npm/yarn for this project."
            } else if (isDirectory) {
              summaryText = "This is a directory containing files and/or other directories."
            } else {
              const fileData = await fetchFileContent(nodePath)
              if (fileData && fileData.content) {
                const { summary } = await summarizeWithGemini(fileData.content, nodeName)
                summaryText = summary
              } else if (fileData && fileData.message) {
                summaryText = fileData.message
              } else {
                summaryText = "No content available for this node."
              }
            }

            // Update the VR info panel with the fetched data
            createVRInfoPanel(object, summaryText)
          })()
        }

        // Get file content and summary for the side panel
        handleNodeClick(object)
      }
    }
  }

  // Handle controller select end
  const onSelectEnd = () => {
    // Optional: Add any release behavior here
  }

  // Handle VR session end
  const handleVRSessionEnd = () => {
    debugOverlay.log("VR session ended")
    debugOverlay.hide()

    // Remove VR controllers
    if (vrControllerRef.current) {
      sceneRef.current.remove(vrControllerRef.current)
      vrControllerRef.current = null
    }

    if (vrControllerGripRef.current) {
      sceneRef.current.remove(vrControllerGripRef.current)
      vrControllerGripRef.current = null
    }

    // Remove VR info panel if exists
    if (vrInfoPanel) {
      sceneRef.current.remove(vrInfoPanel)
      setVrInfoPanel(null)
    }

    // Reset node appearance
    sceneRef.current.traverse((object) => {
      if (object.isNode) {
        object.material.emissiveIntensity = 0.2
        if (object.children[0] && object.children[0].element) {
          object.children[0].element.style.fontSize = "12px"
          object.children[0].element.style.backgroundColor = `rgba(${hexToRgb(object.userData.originalColor)}, 0.7)`
          object.children[0].element.style.padding = "4px 8px"
        }
      }
    })

    // Reset scene background
    sceneRef.current.background = new THREE.Color(0x0a0e17)

    // Reset button text
    if (vrButtonRef.current) {
      vrButtonRef.current.textContent = "Enter VR"
    }
    setIsVRMode(false)
    setVrStatus({ visible: false, message: "" })
    xrSessionRef.current = null
  }

  const handleRepoUrlChange = (e) => {
    setRepoUrl(e.target.value)
  }

  const handleGeminiApiKeyChange = (e) => {
    setGeminiApiKey(e.target.value)
  }

  const handleGithubTokenChange = (e) => {
    setGithubToken(e.target.value)
  }

  const fetchRepoData = async () => {
    setLoading(true)
    setError(null)
    setSelectedNode(null)
    setFileSummary(null)

    try {
      // Extract owner and repo name from GitHub URL
      const regex = /github\.com\/([^/]+)\/([^/]+)/
      const match = repoUrl.match(regex)

      if (!match || match.length < 3) {
        throw new Error("Invalid GitHub repository URL")
      }

      const owner = match[1]
      const repo = match[2].replace(".git", "")

      // First, get the default branch
      const headers = {}
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`
      }

      const repoInfoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
      })

      if (!repoInfoResponse.ok) {
        if (repoInfoResponse.status === 404) {
          throw new Error("Repository not found or private. You may need to provide a GitHub access token.")
        } else if (repoInfoResponse.status === 403) {
          throw new Error("API rate limit exceeded. Please provide a GitHub access token to continue.")
        } else {
          throw new Error(`GitHub API error: ${repoInfoResponse.status}`)
        }
      }

      const repoInfoData = await repoInfoResponse.json()
      const defaultBranch = repoInfoData.default_branch || "main"

      setRepoInfo({ owner, repo, defaultBranch })

      // Now get the file tree using the default branch
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`

      const response = await fetch(apiUrl, {
        headers,
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("API rate limit exceeded. Please provide a GitHub access token to continue.")
        } else {
          throw new Error(`GitHub API error: ${response.status}`)
        }
      }

      const data = await response.json()
      setRepoData(data)
      initThreeJsScene(data)
    } catch (err) {
      setError(err.message)
      if (err.message.includes("rate limit") || err.message.includes("private")) {
        setShowGithubTokenInput(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (path) => {
    if (!path || path === "Root" || path === "node_modules") {
      return null
    }

    try {
      const { owner, repo, defaultBranch } = repoInfo

      // Normalize path by removing any leading slashes
      const normalizedPath = path.replace(/^\/+/, "")
      const encodedPath = encodeURIComponent(normalizedPath)

      const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${defaultBranch}`

      const headers = {}
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`
      }

      const response = await fetch(contentUrl, {
        headers,
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`File not found: ${normalizedPath}`)
        } else if (response.status === 403) {
          throw new Error("API rate limit exceeded. Please provide a GitHub access token to continue.")
        } else {
          throw new Error(`Unable to fetch file content: ${response.status}`)
        }
      }

      const data = await response.json()

      if (data.type !== "file") {
        return {
          content: null,
          isDirectory: true,
          size: null,
          message: "This is a directory.",
        }
      }

      if (data.size > 1000000) {
        // > 1MB
        return {
          content: null,
          size: data.size,
          message: "File is too large to display.",
        }
      }

      // Check if the file is a binary file
      const isBinary = checkIfBinary(data.name)
      if (isBinary) {
        return {
          content: null,
          size: data.size,
          message: "Binary file - summary not available.",
        }
      }

      // Decode base64 content
      const content = atob(data.content.replace(/\n/g, ""))
      return { content, size: data.size }
    } catch (err) {
      console.error("Error fetching file content:", err)

      // If rate limit exceeded, prompt for token
      if (err.message.includes("rate limit")) {
        setShowGithubTokenInput(true)
      }

      return {
        content: null,
        message: `Error: ${err.message}`,
      }
    }
  }

  const checkIfBinary = (filename) => {
    const binaryExtensions = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "bmp",
      "ico",
      "webp",
      "svg",
      "mp3",
      "mp4",
      "wav",
      "ogg",
      "avi",
      "mov",
      "wmv",
      "flv",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "zip",
      "tar",
      "gz",
      "rar",
      "7z",
      "exe",
      "dll",
      "so",
      "dylib",
      "db",
      "sqlite",
      "ttf",
      "woff",
      "woff2",
      "eot",
    ]

    const ext = filename.split(".").pop().toLowerCase()
    return binaryExtensions.includes(ext)
  }

  const summarizeWithGemini = async (content, filename) => {
    if (!geminiApiKey) {
      setShowApiKeyInput(true)
      return {
        summary: "Please provide a Gemini API key to generate summaries.",
        error: true,
      }
    }

    try {
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
      const fullUrl = `${apiUrl}?key=${geminiApiKey}`

      // Truncate content if it's too large
      const truncatedContent =
        content.length > 10000 ? content.substring(0, 10000) + "... [content truncated]" : content

      const fileExtension = filename.split(".").pop().toLowerCase()

      const prompt = `
      You are a code analyst assistant. Please provide a concise summary of the following ${fileExtension} file: 
      
      Filename: ${filename}
      Content:
      
      ${truncatedContent}
      
      Please include:
      1. The main purpose of this file
      2. Key functions or components 
      3. Important dependencies
      4. Any notable patterns or techniques used
      Keep the summary to 3-5 sentences total.
      `

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const summary = data.candidates[0]?.content?.parts[0]?.text || "No summary generated."

      return { summary }
    } catch (err) {
      console.error("Error with Gemini API:", err)
      return {
        summary: `Failed to generate summary: ${err.message}`,
        error: true,
      }
    }
  }

  const handleNodeClick = async (nodeMesh) => {
    if (!nodeMesh || !nodeMesh.userData) return

    const nodeName = nodeMesh.userData.name
    const nodePath = nodeMesh.userData.path
    const isDirectory = nodeMesh.userData.isDirectory
    const isRoot = nodeMesh.userData.isRoot

    if (isRoot) {
      setFileSummary({
        name: "Repository Root",
        summary: "This is the root directory of the repository.",
        path: "/",
      })
      return
    }

    if (nodeName === "node_modules") {
      setFileSummary({
        name: "node_modules",
        summary: "This directory contains all the dependencies installed by npm/yarn for this project.",
        path: "/node_modules",
      })
      return
    }

    setSummaryLoading(true)

    try {
      if (isDirectory) {
        // For directories, just show a simple message
        setFileSummary({
          name: nodeName,
          summary: `This is a directory containing files and/or other directories.`,
          path: nodePath,
          isDirectory: true,
        })
        setSummaryLoading(false)
        return
      }

      const fileData = await fetchFileContent(nodePath)

      if (!fileData) {
        setFileSummary({
          name: nodeName,
          summary: "No content available for this node.",
          path: nodePath || "/" + nodeName,
        })
        return
      }

      if (fileData.message) {
        setFileSummary({
          name: nodeName,
          summary: fileData.message,
          path: nodePath || "/" + nodeName,
          size: fileData.size ? `${(fileData.size / 1024).toFixed(1)} KB` : null,
        })
        return
      }

      const { content, size } = fileData

      if (!content) {
        setFileSummary({
          name: nodeName,
          summary: "Content could not be retrieved.",
          path: nodePath || "/" + nodeName,
        })
        return
      }

      // Summarize with Gemini API
      const { summary, error } = await summarizeWithGemini(content, nodeName)

      setFileSummary({
        name: nodeName,
        summary: summary,
        path: nodePath || "/" + nodeName,
        size: `${(size / 1024).toFixed(1)} KB`,
        error: error,
      })
    } catch (err) {
      setFileSummary({
        name: nodeName,
        summary: `Error: ${err.message}`,
        path: nodePath || "/" + nodeName,
        error: true,
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  // Add a function to create more visible nodes for VR mode
  const createVRNodeMesh = (originalNode) => {
    // Create a more visible version of the node for VR
    const radius = originalNode.geometry.parameters.radius * 1.2
    const geometry = new THREE.SphereGeometry(radius, 32, 32)

    const color = originalNode.userData.originalColor
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.8, // Brighter for VR
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.isNode = true
    mesh.userData = { ...originalNode.userData }
    mesh.position.copy(originalNode.position)

    // Add a glowing effect for better visibility in VR
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
    })
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.5, 32, 32), glowMaterial)
    mesh.add(glowSphere)

    return mesh
  }

  // Create a VR info panel that appears near the node
  const createVRInfoPanel = (nodeMesh, summary) => {
    // Remove existing panel if any
    if (vrInfoPanel) {
      sceneRef.current.remove(vrInfoPanel)
    }

    // Create panel backing
    const panelWidth = 0.5
    const panelHeight = 0.3
    const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight)
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
    const panel = new THREE.Mesh(panelGeometry, panelMaterial)

    // Position panel near the node
    const nodePosition = nodeMesh.position.clone()
    panel.position.set(nodePosition.x + 0.3, nodePosition.y + 0.2, nodePosition.z)

    // Make panel face the user
    panel.lookAt(0, 0, 0)

    // Create text canvas
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext("2d")

    // Fill background
    context.fillStyle = "#111111"
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    context.strokeStyle = "#444444"
    context.lineWidth = 4
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

    // Add title
    context.font = "bold 24px Arial"
    context.fillStyle = "#ffffff"
    context.fillText(nodeMesh.userData.name, 20, 40)

    // Add path
    context.font = "16px Arial"
    context.fillStyle = "#aaaaaa"
    context.fillText(nodeMesh.userData.path || "/", 20, 70)

    // Add summary
    context.font = "16px Arial"
    context.fillStyle = "#ffffff"

    // Wrap text
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text) return
      const words = text.split(" ")
      let line = ""
      let testLine = ""
      let lineCount = 0

      for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + " "
        const metrics = context.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, y + lineCount * lineHeight)
          line = words[n] + " "
          lineCount++
          if (lineCount > 5) {
            line += "..."
            context.fillText(line, x, y + lineCount * lineHeight)
            break
          }
        } else {
          line = testLine
        }
      }

      if (lineCount <= 5) {
        context.fillText(line, x, y + lineCount * lineHeight)
      }
    }

    const summaryText = summary || "Loading information..."
    wrapText(summaryText, 20, 100, canvas.width - 40, 24)

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    // Apply texture to panel
    panel.material.map = texture
    panel.material.needsUpdate = true

    // Add to scene
    sceneRef.current.add(panel)
    setVrInfoPanel(panel)

    return panel
  }

  const initThreeJsScene = (data) => {
    if (!containerRef.current) return

    // Clear previous scene if exists
    if (sceneRef.current) {
      controlsRef.current.dispose()
      containerRef.current.removeChild(rendererRef.current.domElement)
      if (labelRendererRef.current) {
        containerRef.current.removeChild(labelRendererRef.current.domElement)
      }
      if (vrButtonRef.current) {
        vrButtonRef.current.remove()
      }
    }

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e17)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000,
    )
    camera.position.z = 500
    cameraRef.current = camera

    // Setup renderer with WebXR support
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Important for VR
      powerPreference: "high-performance", // Better performance for VR
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true // Enable WebXR
    renderer.outputEncoding = THREE.sRGBEncoding // Better color reproduction
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Setup label renderer
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    labelRenderer.domElement.style.position = "absolute"
    labelRenderer.domElement.style.top = "0"
    labelRenderer.domElement.style.pointerEvents = "none"
    containerRef.current.appendChild(labelRenderer.domElement)
    labelRendererRef.current = labelRenderer

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Add subtle point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x3498db, 1, 1000)
    pointLight1.position.set(300, 300, 300)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x9b59b6, 1, 1000)
    pointLight2.position.set(-300, -300, -300)
    scene.add(pointLight2)

    // Create nodes for repository structure
    createRepoNodes(data, scene)

    // Set up raycaster for node interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseMove = (event) => {
      // Get container bounds
      const rect = containerRef.current.getBoundingClientRect()

      // Calculate mouse position in normalized device coordinates (-1 to +1)
      // using the container's bounds instead of window dimensions
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Find intersections
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)

      // Reset all nodes to original state
      scene.children.forEach((object) => {
        if (object.isNode && object !== selectedNode) {
          object.scale.copy(object.userData.originalScale)
          object.material.emissiveIntensity = 0.2
        }
      })

      // Highlight hovered node
      if (intersects.length > 0) {
        const object = intersects[0].object
        if (object.isNode && object !== selectedNode) {
          object.scale.set(
            object.userData.originalScale.x * 1.3,
            object.userData.originalScale.y * 1.3,
            object.userData.originalScale.z * 1.3,
          )
          object.material.emissiveIntensity = 0.5
          containerRef.current.style.cursor = "pointer"
        } else {
          containerRef.current.style.cursor = "auto"
        }
      } else {
        containerRef.current.style.cursor = "auto"
      }
    }

    // Camera animation helper
    const animateCamera = (targetPosition, duration = 1000) => {
      const startPosition = camera.position.clone()
      const startTime = Date.now()

      const animate = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth movement
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
        const easedProgress = easeOutCubic(progress)

        // Interpolate position
        const newPosition = startPosition.clone().lerp(targetPosition, easedProgress)
        camera.position.copy(newPosition)

        // Look at the target (the node's position)
        controls.target.copy(targetPosition.clone().normalize().multiplyScalar(0.8))
        controls.update()

        // Continue animation if not complete
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    }

    const onMouseClick = (event) => {
      // Get container bounds
      const rect = containerRef.current.getBoundingClientRect()

      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)

      if (intersects.length > 0) {
        const object = intersects[0].object
        if (object.isNode) {
          // Deselect previous node
          if (selectedNode) {
            selectedNode.material.emissiveIntensity = 0.2
            selectedNode.scale.copy(selectedNode.userData.originalScale)

            // Hide connected lines
            scene.children.forEach((child) => {
              if (
                child.isLine &&
                (child.userData.startNode === selectedNode || child.userData.endNode === selectedNode)
              ) {
                child.material.opacity = 0.3
              }
            })
          }

          // Select new node or deselect if same node
          if (selectedNode !== object) {
            setSelectedNode(object)
            object.material.emissiveIntensity = 0.8
            object.scale.set(
              object.userData.originalScale.x * 1.5,
              object.userData.originalScale.y * 1.5,
              object.userData.originalScale.z * 1.5,
            )

            // Highlight connected lines
            scene.children.forEach((child) => {
              if (child.isLine && (child.userData.startNode === object || child.userData.endNode === object)) {
                child.material.opacity = 1
              }
            })

            // Focus camera on the selected node
            const distance = camera.position.length()
            const nodePosition = object.position.clone()
            const direction = nodePosition.clone().normalize()

            // Create a new camera position that's in front of the node
            const targetPosition = direction.multiplyScalar(distance * 0.8)

            // Animate camera to new position
            animateCamera(targetPosition)

            // Get file content and summary
            handleNodeClick(object)
          } else {
            setSelectedNode(null)
            setFileSummary(null)
          }
        }
      }
    }

    // Use container for event listening instead of window to fix hit detection
    containerRef.current.addEventListener("mousemove", onMouseMove)
    containerRef.current.addEventListener("click", onMouseClick)

    // Set up XR animation loop with controller interaction
    renderer.setAnimationLoop((timestamp, frame) => {
      if (isVRMode && frame) {
        // Handle controller interaction in VR
        if (vrControllerRef.current) {
          // Create a ray from the controller
          const tempMatrix = new THREE.Matrix4()
          tempMatrix.identity().extractRotation(vrControllerRef.current.matrixWorld)

          raycasterRef.current.ray.origin.setFromMatrixPosition(vrControllerRef.current.matrixWorld)
          raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

          // Check for intersections with nodes
          const intersects = raycasterRef.current.intersectObjects(scene.children)

          if (intersects.length > 0) {
            const object = intersects[0].object
            if (object.isNode) {
              if (intersectedRef.current !== object) {
                // Reset previous intersection
                if (intersectedRef.current) {
                  intersectedRef.current.scale.copy(intersectedRef.current.userData.originalScale)
                  if (intersectedRef.current !== selectedNode) {
                    intersectedRef.current.material.emissiveIntensity = 0.2
                  }
                }

                // Highlight new intersection
                intersectedRef.current = object
                if (object !== selectedNode) {
                  object.scale.set(
                    object.userData.originalScale.x * 1.3,
                    object.userData.originalScale.y * 1.3,
                    object.userData.originalScale.z * 1.3,
                  )
                  object.material.emissiveIntensity = 0.5
                }
              }
            } else {
              // Reset if not pointing at a node
              if (intersectedRef.current) {
                if (intersectedRef.current !== selectedNode) {
                  intersectedRef.current.scale.copy(intersectedRef.current.userData.originalScale)
                  intersectedRef.current.material.emissiveIntensity = 0.2
                }
                intersectedRef.current = null
              }
            }
          } else {
            // Reset if not pointing at anything
            if (intersectedRef.current) {
              if (intersectedRef.current !== selectedNode) {
                intersectedRef.current.scale.copy(intersectedRef.current.userData.originalScale)
                intersectedRef.current.material.emissiveIntensity = 0.2
              }
              intersectedRef.current = null
            }
          }
        }

        // Render the scene
        renderer.render(scene, camera)

        // Update label renderer in VR mode to ensure labels are visible
        if (labelRendererRef.current) {
          labelRendererRef.current.render(scene, camera)
        }

        // Run label animations in VR mode
        sceneRef.current.traverse((object) => {
          if (object.isNode && object.userData.labelAnimation) {
            object.userData.labelAnimation()
          }
        })

        // Update label orientations to face the camera
        updateLabelOrientations(camera)
      } else if (!isVRMode) {
        // Regular animation loop for non-VR mode
        if (!controls.enableRotate) {
          scene.rotation.y += 0.001
        }

        controls.update()
        renderer.render(scene, camera)
        if (labelRendererRef.current) {
          labelRendererRef.current.render(scene, camera)
        }
      }
    })

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      if (labelRenderer) {
        labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }

      // Check if device is mobile
      const newIsMobile = window.innerWidth <= 768
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile)
      }

      // Update VR button position based on screen size
      if (vrButtonRef.current) {
        vrButtonRef.current.style.bottom = newIsMobile ? "20px" : "80px"
        vrButtonRef.current.style.left = newIsMobile ? "50%" : "30px"
        vrButtonRef.current.style.transform = newIsMobile ? "translateX(-50%)" : "none"
        vrButtonRef.current.style.fontSize = newIsMobile ? "16px" : "16px"
        vrButtonRef.current.style.width = newIsMobile ? "160px" : "auto"
      }
    }

    window.addEventListener("resize", handleResize)

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", handleResize)

      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", onMouseMove)
        containerRef.current.removeEventListener("click", onMouseClick)
      }

      // Clean up VR info panel if it exists
      if (vrInfoPanel) {
        sceneRef.current.remove(vrInfoPanel)
        setVrInfoPanel(null)
      }
    }
  }

  const createRepoNodes = (data, scene) => {
    if (!data || !data.tree) return

    // Create a map to store paths and their nodes
    const nodeMap = new Map()

    // Create map of actual paths from GitHub API
    const actualPathMap = new Map()
    data.tree.forEach((item) => {
      const pathParts = item.path.split("/")
      // Store all valid paths from GitHub
      for (let i = 1; i <= pathParts.length; i++) {
        const partialPath = pathParts.slice(0, i).join("/")
        actualPathMap.set(partialPath, item.type)
      }
    })

    // Add root node
    const rootNode = createNodeMesh("Root", 0x6495ed, 10)
    rootNode.position.set(0, 0, 0)
    rootNode.userData.path = ""
    rootNode.userData.isRoot = true
    scene.add(rootNode)
    nodeMap.set("", { node: rootNode, children: [] })

    // Process tree items to find top-level directories and files
    const processedPaths = new Set()
    const nodeModulesPaths = new Set()

    data.tree.forEach((item) => {
      const pathParts = item.path.split("/")

      // Check if this is a node_modules file/folder
      if (item.path.startsWith("node_modules/") || pathParts.includes("node_modules")) {
        // Only add the top node_modules directory, not its contents
        nodeModulesPaths.add("node_modules")
        return
      }

      // For other paths, we'll include only the top two levels for clarity
      if (pathParts.length > 0) {
        if (pathParts.length === 1) {
          // Top-level item
          processedPaths.add(pathParts[0])
        } else {
          // Second-level item (folder/file)
          processedPaths.add(`${pathParts[0]}/${pathParts[1]}`)
        }
      }
    })

    // Add node_modules as a special node if it exists
    if (nodeModulesPaths.size > 0) {
      processedPaths.add("node_modules")
    }

    // Convert to array and sort by path depth
    const uniquePaths = Array.from(processedPaths).sort((a, b) => {
      return a.split("/").length - b.split("/").length
    })

    // Create nodes for each unique path
    uniquePaths.forEach((path) => {
      const pathParts = path.split("/")
      const name = pathParts[pathParts.length - 1]
      let parentPath = ""

      if (pathParts.length > 1) {
        parentPath = pathParts.slice(0, -1).join("/")
      }

      // Check if parent exists in the map
      const parentInfo = nodeMap.get(parentPath)
      if (!parentInfo) return

      // Skip if this node already exists
      if (nodeMap.has(path)) return

      // Create node with color based on type
      let color, size
      let isDirectory = true

      // Check if this is a directory or file based on GitHub API data
      if (actualPathMap.has(path)) {
        isDirectory = actualPathMap.get(path) === "tree"
      } else {
        // If not in the map, check if there are any paths that start with this path + "/"
        const pathWithSlash = path + "/"
        isDirectory = Array.from(actualPathMap.keys()).some((key) => key.startsWith(pathWithSlash) || key === path)
      }

      if (name === "node_modules") {
        // Special styling for node_modules
        color = 0xff5722
        size = 12
      } else if (isDirectory) {
        // Directory
        color = 0x4caf50
        size = 8
      } else {
        // File
        color = getFileColor(name)
        size = 6
      }

      const nodeMesh = createNodeMesh(name, color, size)
      nodeMesh.userData.path = path // Store the path
      nodeMesh.userData.isDirectory = isDirectory

      // Calculate position with a more interesting layout
      const baseAngle = (Math.PI * 2) / 6 // Use 6 as divisor for more space
      const angleVariation = Math.random() * 0.5 - 0.25 // Add some randomness
      const angle = parentInfo.children.length * baseAngle + angleVariation

      const distanceBase = pathParts.length * 100
      const distanceVariation = Math.random() * 20
      const distance = distanceBase + distanceVariation

      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      const z = (pathParts.length - 1) * -50

      nodeMesh.position.set(x, y, z)
      scene.add(nodeMesh)

      // Create connecting line
      const points = []
      points.push(parentInfo.node.position.clone())
      points.push(nodeMesh.position.clone())

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const lineMaterial = new THREE.LineBasicMaterial({
        color: name === "node_modules" ? 0xff5722 : 0x6c757d,
        transparent: true,
        opacity: 0.3,
        linewidth: name === "node_modules" ? 2 : 1,
      })

      const line = new THREE.Line(lineGeometry, lineMaterial)
      line.isLine = true
      line.userData = {
        startNode: parentInfo.node,
        endNode: nodeMesh,
      }
      scene.add(line)

      // Add pulsing effect for node_modules
      if (name === "node_modules") {
        const pulse = () => {
          const scale = 1 + 0.1 * Math.sin(Date.now() * 0.001)
          nodeMesh.scale.set(scale, scale, scale)
          requestAnimationFrame(pulse)
        }
        pulse()
      }

      // Add to node map
      nodeMap.set(path, {
        node: nodeMesh,
        children: [],
        parent: parentInfo.node,
        line: line,
      })

      // Add to parent's children
      parentInfo.children.push(nodeMesh)
    })
  }

  const createNodeMesh = (name, color, radius) => {
    // More detailed geometry for important nodes
    const isSpecialNode = name === "node_modules" || name === "Root"
    const geometry = isSpecialNode
      ? new THREE.DodecahedronGeometry(radius, 1)
      : new THREE.SphereGeometry(radius, 32, 32)

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.2,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.isNode = true

    // Store original properties
    mesh.userData = {
      originalScale: mesh.scale.clone(),
      originalColor: color,
      name: name,
    }

    // Add label
    const div = document.createElement("div")
    div.className = "node-label"
    div.textContent = name
    div.style.color = "#ffffff"
    div.style.padding = "4px 8px"
    div.style.borderRadius = "4px"
    div.style.backgroundColor = `rgba(${hexToRgb(color)}, 0.7)`
    div.style.fontSize = "12px"
    div.style.fontWeight = isSpecialNode ? "bold" : "normal"
    div.style.fontFamily = '"Inter", "SF Pro Display", system-ui, sans-serif'
    div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)"
    div.style.backdropFilter = "blur(5px)"

    const label = new CSS2DObject(div)
    label.position.set(0, radius + 5, 0)
    mesh.add(label)

    return mesh
  }

  const getFileColor = (filename) => {
    const extension = filename.split(".").pop().toLowerCase()

    // Modern color mapping for file extensions
    const colorMap = {
      js: 0xf7df1e, // JavaScript - yellow
      jsx: 0x61dafb, // React - light blue
      ts: 0x3178c6, // TypeScript - blue
      tsx: 0x61dafb, // TypeScript React - light blue
      css: 0x563d7c, // CSS - purple
      scss: 0xcd6799, // SCSS - pink
      html: 0xe34f26, // HTML - orange
      json: 0x292929, // JSON - dark gray
      md: 0x0076c1, // Markdown - blue
      py: 0x3776ab, // Python - blue
      java: 0xea2d2e, // Java - red
      go: 0x00add8, // Go - light blue
      rs: 0xdea584, // Rust - orange/tan
      rb: 0xcc342d, // Ruby - red
      php: 0x777bb4, // PHP - purple
      c: 0x555555, // C - gray
      cpp: 0x00599c, // C++ - blue
      cs: 0x239120, // C# - green
      swift: 0xffac45, // Swift - orange
      kt: 0xa97bff, // Kotlin - purple
      lock: 0x7a7a7a, // lock files - gray
      gitignore: 0xf05033, // gitignore - red
      env: 0x4caf50, // env files - green
    }

    return colorMap[extension] || 0x9e9e9e // Default gray for unknown extensions
  }

  // Utility function to convert hex color to RGB
  const hexToRgb = (hex) => {
    const r = (hex >> 16) & 255
    const g = (hex >> 8) & 255
    const b = hex & 255
    return `${r}, ${g}, ${b}`
  }

  // Let's add a special billboard mode for labels in VR to ensure they always face the user
  // Add this function after the debugLabelsInVR function

  // Make labels always face the camera (billboard effect)
  const updateLabelOrientations = (camera) => {
    if (!sceneRef.current) return

    sceneRef.current.traverse((object) => {
      if (object.isNode && object.children[0]) {
        // Get the label
        const label = object.children[0]

        // Make label face the camera
        // This is a simplified approach - for true billboarding we'd use a more complex solution
        // But this works well enough for our labels
        if (isVRMode) {
          // Get camera position in world space
          const cameraWorldPos = new THREE.Vector3()
          camera.getWorldPosition(cameraWorldPos)

          // Get node position in world space
          const nodeWorldPos = new THREE.Vector3()
          object.getWorldPosition(nodeWorldPos)

          // Calculate direction from node to camera
          const direction = new THREE.Vector3().subVectors(cameraWorldPos, nodeWorldPos).normalize()

          // Create a temporary object to help with rotation
          const tempObj = new THREE.Object3D()
          tempObj.position.copy(label.position)
          tempObj.lookAt(direction)

          // Apply rotation to make label face camera
          label.setRotationFromEuler(tempObj.rotation)
        }
      }
    })
  }

  // Add VR mode toggle styles
  useEffect(() => {
    // Add styles for VR mode
    const style = document.createElement("style")
    style.textContent = `
    .vr-button {
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }
    
    .vr-button:hover {
      background-color: #45a049 !important;
      transform: translateY(-2px) ${isMobile ? "translateX(-50%)" : ""};
      box-shadow: 0 6px 12px rgba(0,0,0,0.4);
    }
    
    .vr-button:active {
      transform: translateY(1px) ${isMobile ? "translateX(-50%)" : ""};
    }
    
    @media (max-width: 768px) {
      .vr-button {
        padding: 12px 20px !important;
        font-size: 16px !important;
        width: 160px !important;
      }
    }
  `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [isMobile])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="p-6 bg-black/70 backdrop-blur-lg border-b border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          GitHub Repository 3D Visualizer with Gemini Summaries
        </h1>

        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={handleRepoUrlChange}
              placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
              className="flex-1 p-3 rounded-lg bg-gray-800/80 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
            />
            <button
              onClick={fetchRepoData}
              disabled={loading || !repoUrl}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                "Visualize Repository"
              )}
            </button>
          </div>

          {showApiKeyInput && !geminiApiKey && (
            <div className="mt-4 p-4 bg-blue-900/50 rounded-lg border border-blue-700/50">
              <h3 className="font-medium mb-2 text-blue-100">Gemini API Key Required</h3>
              <p className="text-sm mb-3 text-blue-200">
                To generate file summaries, please provide your Gemini API key:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={handleGeminiApiKeyChange}
                  placeholder="Paste your Gemini API key"
                  className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white"
                >
                  Save
                </button>
              </div>
              <p className="text-xs mt-2 text-blue-300">
                Your API key is stored only in your browser's memory and is not sent to our servers.
              </p>
            </div>
          )}

          {showGithubTokenInput && (
            <div className="mt-4 p-4 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
              <h3 className="font-medium mb-2 text-indigo-100">GitHub Access Token Recommended</h3>
              <p className="text-sm mb-3 text-indigo-200">
                For private repositories or to avoid API rate limits, provide a GitHub personal access token:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={githubToken}
                  onChange={handleGithubTokenChange}
                  placeholder="Paste your GitHub token"
                  className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
                />
                <button
                  onClick={() => setShowGithubTokenInput(false)}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white"
                >
                  Save
                </button>
              </div>
              <p className="text-xs mt-2 text-indigo-300">
                Your token is stored only in your browser's memory and is never sent to our servers.
              </p>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="m-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <h3 className="font-medium mb-1 text-red-200">Error</h3>
          <p className="text-red-100">{error}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 3D Visualization Area */}
        <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ touchAction: "none" }}></div>

        {/* Right Panel - File Info */}
        <div className="w-96 bg-gray-800/90 backdrop-blur-lg p-6 overflow-y-auto border-l border-gray-700 flex flex-col">
          {selectedNode ? (
            <>
              <h2 className="text-xl font-bold mb-1 truncate text-white">{fileSummary?.name || "Loading..."}</h2>
              <p className="text-sm text-gray-300 mb-3">{fileSummary?.path || ""}</p>

              {fileSummary?.size && (
                <div className="mb-3 text-sm">
                  <span className="inline-block px-2 py-1 bg-gray-700 rounded-md text-gray-300">
                    {fileSummary.size}
                  </span>
                </div>
              )}

              <div className="mt-2">
                <h3 className="text-sm uppercase tracking-wider text-gray-300 mb-2">Summary</h3>

                {summaryLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg ${fileSummary?.error ? "bg-red-900/30" : "bg-gray-900/60"}`}>
                    <p className="whitespace-pre-line text-gray-100">
                      {fileSummary?.summary || "No summary available."}
                    </p>

                    {fileSummary?.error && !geminiApiKey && (
                      <button
                        onClick={() => setShowApiKeyInput(true)}
                        className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Set Gemini API Key
                      </button>
                    )}
                  </div>
                )}
              </div>

              {geminiApiKey && (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="mt-4 text-xs text-gray-400 hover:text-gray-300 self-end"
                >
                  Change API Key
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-300">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 17.25V12.75L5.25 9H18.75L15 12.75V17.25" />
                <path d="M12 17.25V21.75" />
                <circle cx="12" cy="5.25" r="2.25" />
              </svg>
              <h3 className="mt-4 font-medium text-gray-200">No File Selected</h3>
              <p className="mt-2 text-sm max-w-xs text-gray-400">
                Click on a node in the visualization to view its details and get a Gemini-powered summary.
              </p>

              {isVRMode && (
                <div className="mt-6 p-4 bg-green-900/50 rounded-lg border border-green-700/50">
                  <h3 className="font-medium mb-2 text-green-200">VR Mode Active</h3>
                  <p className="text-sm text-green-300">
                    Use your VR controllers to point at and select nodes in the visualization.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VR Status Indicator */}
      <VRStatusIndicator isVisible={vrStatus.visible} message={vrStatus.message} />
    </div>
  )
}

export default GithubRepoVisualizer
