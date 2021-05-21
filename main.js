/*
CITATIONS:
1. CSVToArray: https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
2. mnist_test.csv: https://www.kaggle.com/oddrationale/mnist-in-csv
3. three.js: https://www.threejs.org
*/



import { OrbitControls } from './lib/OrbitControls.js';
import * as THREE from './lib/three.module.js';
// import { UMAP } from './lib/umap-js.min.js'
// import * as tf from './lib/tf.min.js';


function dot(a,b){
    let dot = 0.0
    for(let z = 0; z < a.length; z+=1){
        dot += parseInt(a[z]) * parseInt(b[z])
    } 
    return dot    
}


function norm(a){
    return Math.sqrt(dot(a,a))
}


function cosDistance(a,b){
    return dot(a,b) / (norm(a)*norm(b))
}




function distance(a,b){
    let distance = 0.0
    for(let z = 0; z < a.length; z+=1){
        distance += Math.abs(parseInt(a[z]) - parseInt(b[z])) 
    } 
    return distance    
}


//the following function from
//https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}


async function Main(){

    var method = "force-directed-euclid";

    const selectElement = document.getElementById('method');
    selectElement.addEventListener('change', (event) => {
        console.log(`Selected ${event.target.value}`);
        method = event.target.value        
        for(let x = 0; x < images.length; x+=1){
            let rowdistances = []
            for(let y = 0; y < images.length; y+=1){
                if(method=="force-directed-euclid"){
                    rowdistances.push(distance(images[x], images[y]) / 1500.0)
                }
                // MAX_PIX_DIST = Math.max(MAX_PIX_DIST, rowdistances[rowdistances.length-1])        
                else{
                    rowdistances.push(cosDistance(images[x], images[y]) / 1500.0)
                }
            }
            distances.push(rowdistances)
        }   
    });

    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onClick( event ) {

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        // update the picking ray with the camera and mouse position
        raycaster.setFromCamera( mouse, camera );

        // calculate objects intersecting the picking ray
        const selecteds = raycaster.intersectObjects( scene.children );
                
        if(selecteds.length>0){
            const selected = selecteds[0].object            
        }
    }



    window.addEventListener( 'click', onClick, false );


    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    const canv = document.getElementById("canvas")
    const renderer = new THREE.WebGLRenderer({canvas:canv});
    const controls = new OrbitControls( camera, renderer.domElement );
    const axesHelper = new THREE.AxesHelper( 20 );
    scene.add( axesHelper );
    camera.position.set( 0, 0, -30 );

    scene.background = new THREE.Color("rgb(155, 155, 155)")
    // renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setSize( 1200,800 );
    // document.body.appendChild( renderer.domElement );


    // const cubegeometry = new THREE.BoxGeometry();
    // const cubematerial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( cubegeometry, cubematerial );
    // scene.add( cube );

    const colors = ['#00429d', '#3e67ae', '#618fbf', '#85b7ce', '#b1dfdb', '#ffcab9', '#fd9291', '#e75d6f', '#c52a52', '#93003a']
    const loadfile = await fetch("./data/mnist/mnist_test.csv")
    const text = await loadfile.text()
    const mnist = CSVToArray(text)
    const labels = mnist.slice(1,200).map(row=>parseInt(row[0]))
    const images = mnist.slice(1,200).map(row=>row.slice(1).map(e=>parseInt(e)))    
    const norms = images.map(e=>e.reduce((a,b)=>a+b, 0)/728.0)
    var png
    var map, material, sprite
    var sprites = []
    const spread = 2
    var MAX_PIX_DIST = 0
    const MAX_SPACE_DIST = 10.0
    var velocities = Array(images.length).fill(null).map(e=>new THREE.Vector3())


    const umap = new UMAP();
    const embedding = umap.fit(images);



    //1. Precompute pairwise distances    
    var distances = []   
    for(let x = 0; x < images.length; x+=1){
        let rowdistances = []
        for(let y = 0; y < images.length; y+=1){
            if(method=="force-directed-euclid"){
                rowdistances.push(distance(images[x], images[y]) / 1500.0)
            }
            // MAX_PIX_DIST = Math.max(MAX_PIX_DIST, rowdistances[rowdistances.length-1])        
            else{
                rowdistances.push(cosDistance(images[x], images[y]))
            }
        }
        distances.push(rowdistances)
    }   
    console.log(distances)


    

    //2. Random initial layout    
    for (let index = 0; index < images.length; index++) {
        var imageCanvas = document.createElement("canvas")
        imageCanvas.setAttribute("width","28px")
        imageCanvas.setAttribute("height","28px")
        var g = imageCanvas.getContext("2d")
        for (let i = 0; i < 28; i++) {
            for (let j = 0; j < 28; j++) {                        
                g.fillStyle = images[index][i*28 + j]==0 ? 
                                colors[labels[index]] :
                                `rgba(${images[index][i*28 + j]},${images[index][i*28 + j]},${images[index][i*28 + j]},1)`
                g.fillRect(j,i,1,1)                    
            }                
        }
        png = imageCanvas.toDataURL()
        // document.body.appendChild(imageCanvas)

        map = new THREE.TextureLoader().load( png )
        // map.magFilter = THREE.NearestFilter
        // map.minFilter = THREE.NearestFilter
        material = new THREE.SpriteMaterial( { map: map } );
        sprite = new THREE.Sprite( material );
        sprite.position.x = 5.0 - Math.random()*10
        sprite.position.y = 5.0 - Math.random()*10
        sprite.position.z = 5.0 - Math.random()*10
        sprite.index = index                               
        scene.add( sprite );
        sprites.push(sprite);
    }
        
     
    


    var enterPressed = false
    window.addEventListener("keypress",(e)=>{
        console.log("pressed ",e.key)
        if(e.key=="Enter"){
            enterPressed=true
        }
    })




    //controls.update() must be called after any manual changes to the camera's transform
    
    // controls.autoRotate = true;


    // camera.position.z = 5;
    var frame = 0


    const animate = function () {
        frame+=1
        
        controls.update();

         // console.log("after ",sprites[0].position.toArray().toString())
         for(let i = 0; i < velocities.length; i+=1){
            velocities[i].multiplyScalar(0.90)
            sprites[i].position.add(velocities[i])            
        }

        for(let iters = 0; iters < 45; iters++){
            let a = Math.floor(Math.random()*images.length)
            let locA = new THREE.Vector3().copy(sprites[a].position)

            let force = new THREE.Vector3()
            for(let i = 0; i < distances[a].length; i+=1){
                if(method=="force-directed-euclid"){
                    if(true){
                        let diff = new THREE.Vector3().subVectors(locA, sprites[i].position)            
                        let mag = distances[a][i] - diff.length()
                        force.add(diff.normalize().multiplyScalar(mag / distances[a].length))            
                    }
                    else{
                        let diff = new THREE.Vector3().subVectors(locA, sprites[i].position)            
                        let mag = Math.max(10.0, diff.length()) - diff.length()
                        force.add(diff.normalize().multiplyScalar(mag / distances[a].length))            
                    }
                }
                else{
                    let diff = new THREE.Vector3().subVectors(locA, sprites[i].position)            
                    let mag = (50*distances[a][i]) - diff.length()
                    // console.log(mag)
                    force.add(diff.normalize().multiplyScalar(mag))            
                }
                
            }
            
            
            if(method=="force-directed-euclid"){
                velocities[a].add(force.multiplyScalar(0.1))
            }
            else{
                velocities[a].add(force.multiplyScalar(0.001))
            }


            
        }
        

        // console.log(sprites[a].position)
        

        
        
        renderer.render( scene, camera );
        requestAnimationFrame( animate );
    }

    requestAnimationFrame( animate )
}


Main()

