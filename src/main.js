import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./fabian.png", {
    sliceX: 24,
    sliceY: 7,
    anims: {
        "idle-down": 3,
        "walk-down": { from: 66, to: 71, loop: true, speed: 8},
        "idle-slide": 24,
        "walk-slide": { from: 48, to: 53, loop: true, speed: 8},
        "idle-up": 30,
        "walk-up": { from: 54, to: 59, loop: true, speed: 8}
    }
});

k.loadSprite("map", "./map.png");
k.loadSprite("boundaries", "./boundaries.png"); // Cargar la imagen de los límites

k.setBackground(k.Color.fromHex("#464660"));

k.scene("main", async () => {
    // Initialize game elements
    const mapData = await (await fetch("./map.json")).json();
    const layers = mapData.layers;

    const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

    const player = k.make([
        k.sprite("spritesheet",{anim: "idle-down"}), 
        k.area({
            shape: new k.Rect(k.vec2(0,11), 8,8)
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 220,
            direction: "down",
            isInDialogue: false,
        },
        "player"
    ]);

    for (const layer of layers) {
        if(layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic: true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if(boundary.name) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true
                        displayDialogue(dialogueData[boundary.name], () => (player.isInDialogue = false));
                    })
                }
            }
            continue;
        }
        if (layer.name === "spawnpoints") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor,
                    );
                    k.add(player);
                    continue;
                }
            }
        }
    }

    // Agregar la imagen de los límites sobre el mapa
    const boundary = k.add([
        k.sprite("boundaries"),
        k.pos(0), // Ajusta la posición según sea necesario
        k.scale(scaleFactor),
    ]);

    // Set camera scale and update functions
    setCamScale(k);

    k.onResize(() => {
        setCamScale(k);
    });

    k.onUpdate(()=> {
        k.camPos(player.pos.x, player.pos.y + 100);
    });

    // Mouse events
    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos)

        const lowerBound = 50
        const upperBound = 125;

        // Player animation up
        if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== "walk-up") {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        // Player animation down
        if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== "walk-down") {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        // Player animation sideways
        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-slide") player.play("walk-slide");
            player.direction = "right";
            return;
        }

        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if (player.curAnim() !== "walk-slide") player.play("walk-slide");
            player.direction = "left";
            return;
        }
    });

    k.onMouseRelease(() => {
        if (player.direction === "down") {
            player.play("idle-down");
            return;
        }
        if (player.direction === "up") {
            player.play("idle-up");
            return;
        }

        player.play("idle-slide");
    });

    // Display mensaje de bienvenida
    displayDialogue(dialogueData.welcome, () => {
    });
});

k.go("main");
