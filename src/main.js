import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8},
        "idle-slide": 975,
        "walk-slide": { from: 975, to: 978, loop: true, speed: 8},
        "idle-up": 975,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8}
    }
});

k.loadSprite("map", "./map2.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
    // Initialize game elements
    const mapData = await (await fetch("./map2.json")).json();
    const layers = mapData.layers;

    const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

    const player = k.make([
        k.sprite("spritesheet",{anim: "idle-down"}), 
        k.area({
            shape: new k.Rect(k.vec2(0,3), 10,10)
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
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
