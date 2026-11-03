/* Mended (working title) — content tables. Pure data: categories, faults, tests, parts, suppliers, staff, blocks, story arcs, endings. */
(function (root) {
'use strict';
const WEEKS_PER_YEAR = 52, CAMPAIGN_WEEKS = 156;

/* Parts: price at the standard supplier. */
const PARTS = {
  fuse: ['Fuse', 1], cord: ['Mains cord', 6], switch: ['Switch', 4], element: ['Heating element', 12], thermostat: ['Thermostat', 9], seal: ['Seal kit', 3], bulbholder: ['Bulb holder', 5], dimmer: ['Dimmer module', 11], cap: ['Capacitor set', 7], speaker: ['Speaker', 14], pot: ['Potentiometer', 4], belt: ['Drive belt', 5], tube: ['Inner tube', 6], tyre: ['Tyre', 18], chain: ['Chain', 15], brakepads: ['Brake pads', 8], cable: ['Cable set', 6], bearing: ['Bearing set', 12], spoke: ['Spokes', 4], pedal: ['Pedal pair', 10], lever: ['Lever', 7], spring: ['Spring', 2], crumbtray: ['Crumb tray', 5], timer: ['Timer board', 13], psu: ['Power supply', 22], hdmi: ['Video port', 16], fan: ['Fan', 9], paste: ['Thermal paste', 3], stick: ['Joystick module', 11], drive: ['Disc drive', 28], screen: ['Screen', 45], battery: ['Battery', 19], port: ['Charging port', 12], button: ['Button flex', 8], needle: ['Needle pack', 3], bobbin: ['Bobbin case', 9], motor: ['Motor', 30], foot: ['Presser foot', 7], gear: ['Gear set', 14], antenna: ['Antenna', 6], dial: ['Dial cord', 3], mic: ['Microphone', 10]
};

/* Categories with diagnostic tests and fault tables. Each fault: symptoms it can present with, an outcome per test, parts, hours, difficulty. */
const CATEGORIES = [
  { id: 'kettle', name: 'Kettle', icon: '🫖', replace: [18, 45], unlockCost: 0, tests: { power: 'Plug-in test', cont: 'Continuity check', lid: 'Lid & seal check', boil: 'Boil test' },
    faults: [
      { id: 'k_fuse', name: 'Blown plug fuse', sym: ['Dead, no light', 'Stopped suddenly'], t: { power: 'no light', cont: 'plug open', lid: 'fine', boil: 'no heat' }, parts: ['fuse'], hours: 2, diff: 1 },
      { id: 'k_cord', name: 'Frayed cord', sym: ['Dead, no light', 'Works if you wiggle it'], t: { power: 'flickers', cont: 'cord open', lid: 'fine', boil: 'intermittent' }, parts: ['cord'], hours: 4, diff: 1 },
      { id: 'k_element', name: 'Failed element', sym: ['Light on, no heat', 'Tripped the fuse box'], t: { power: 'light on', cont: 'element open', lid: 'fine', boil: 'no heat' }, parts: ['element'], hours: 6, diff: 2 },
      { id: 'k_stat', name: 'Stuck thermostat', sym: ['Never switches off', 'Switches off too early'], t: { power: 'light on', cont: 'fine', lid: 'fine', boil: 'wrong cut-off' }, parts: ['thermostat'], hours: 5, diff: 2 },
      { id: 'k_switch', name: 'Worn switch', sym: ['Works if you wiggle it', 'Switches off too early'], t: { power: 'light on', cont: 'switch open', lid: 'fine', boil: 'intermittent' }, parts: ['switch'], hours: 3, diff: 1 },
      { id: 'k_seal', name: 'Leaking seal', sym: ['Leaks on the counter', 'Switches off too early'], t: { power: 'light on', cont: 'fine', lid: 'seal perished', boil: 'leaks' }, parts: ['seal'], hours: 3, diff: 1 },
      { id: 'k_lid', name: 'Broken lid catch', sym: ['Leaks on the counter', 'Never switches off'], t: { power: 'light on', cont: 'fine', lid: 'catch broken', boil: 'steam escapes' }, parts: ['spring'], hours: 2, diff: 1 },
      { id: 'k_scale', name: 'Scaled element', sym: ['Light on, no heat', 'Never switches off'], t: { power: 'light on', cont: 'fine', lid: 'fine', boil: 'slow, noisy' }, parts: [], hours: 2, diff: 1 },
      { id: 'k_base', name: 'Base contact burnt', sym: ['Dead, no light', 'Tripped the fuse box'], t: { power: 'no light', cont: 'base open', lid: 'fine', boil: 'no heat' }, parts: ['switch', 'cord'], hours: 5, diff: 2 }
    ] },
  { id: 'lamp', name: 'Lamp', icon: '💡', replace: [15, 90], unlockCost: 0, tests: { power: 'Plug-in test', cont: 'Continuity check', bulb: 'Bulb & holder check', dim: 'Dimmer sweep' },
    faults: [
      { id: 'l_fuse', name: 'Blown plug fuse', sym: ['Dead', 'Went with a pop'], t: { power: 'dead', cont: 'plug open', bulb: 'fine', dim: 'n/a' }, parts: ['fuse'], hours: 2, diff: 1 },
      { id: 'l_cord', name: 'Damaged flex', sym: ['Dead', 'Flickers when moved'], t: { power: 'flickers', cont: 'flex open', bulb: 'fine', dim: 'n/a' }, parts: ['cord'], hours: 4, diff: 1 },
      { id: 'l_holder', name: 'Burnt bulb holder', sym: ['Flickers when moved', 'Smells hot'], t: { power: 'flickers', cont: 'fine', bulb: 'holder scorched', dim: 'n/a' }, parts: ['bulbholder'], hours: 3, diff: 1 },
      { id: 'l_switch', name: 'Failed inline switch', sym: ['Dead', 'Stuck on'], t: { power: 'dead', cont: 'switch open', bulb: 'fine', dim: 'n/a' }, parts: ['switch'], hours: 2, diff: 1 },
      { id: 'l_dimmer', name: 'Dimmer module gone', sym: ['Only full brightness', 'Buzzes'], t: { power: 'on', cont: 'fine', bulb: 'fine', dim: 'no response' }, parts: ['dimmer'], hours: 5, diff: 2 },
      { id: 'l_dimcap', name: 'Dimmer capacitor', sym: ['Buzzes', 'Flickers when moved'], t: { power: 'on', cont: 'fine', bulb: 'fine', dim: 'jumps' }, parts: ['cap'], hours: 4, diff: 2 },
      { id: 'l_touch', name: 'Touch sensor failed', sym: ['Stuck on', 'Only full brightness'], t: { power: 'on', cont: 'fine', bulb: 'fine', dim: 'ignores touch' }, parts: ['dimmer', 'cap'], hours: 6, diff: 3 },
      { id: 'l_stem', name: 'Loose stem wiring', sym: ['Flickers when moved', 'Went with a pop'], t: { power: 'flickers', cont: 'intermittent', bulb: 'fine', dim: 'n/a' }, parts: [], hours: 3, diff: 2 },
      { id: 'l_earth', name: 'Earth fault', sym: ['Smells hot', 'Went with a pop'], t: { power: 'trips', cont: 'short to frame', bulb: 'fine', dim: 'n/a' }, parts: ['cord'], hours: 5, diff: 3 }
    ] },
  { id: 'toaster', name: 'Toaster', icon: '🍞', replace: [20, 70], unlockCost: 180, tests: { power: 'Plug-in test', cont: 'Continuity check', lever: 'Lever & latch check', timer: 'Timer test' },
    faults: [
      { id: 't_fuse', name: 'Blown plug fuse', sym: ['Dead', 'Went with a pop'], t: { power: 'dead', cont: 'plug open', lever: 'fine', timer: 'n/a' }, parts: ['fuse'], hours: 2, diff: 1 },
      { id: 't_element', name: 'Broken element wire', sym: ['Toasts one side only', 'Barely warms'], t: { power: 'on', cont: 'element open', lever: 'fine', timer: 'fine' }, parts: ['element'], hours: 6, diff: 2 },
      { id: 't_latch', name: 'Latch magnet failed', sym: ["Won't stay down", 'Pops up at once'], t: { power: 'on', cont: 'fine', lever: 'no hold', timer: 'fine' }, parts: ['lever'], hours: 3, diff: 1 },
      { id: 't_spring', name: 'Tired spring', sym: ["Won't pop up", 'Toast stuck'], t: { power: 'on', cont: 'fine', lever: 'weak return', timer: 'fine' }, parts: ['spring'], hours: 2, diff: 1 },
      { id: 't_timer', name: 'Timer board failed', sym: ['Pops up at once', 'Never pops up'], t: { power: 'on', cont: 'fine', lever: 'fine', timer: 'no count' }, parts: ['timer'], hours: 5, diff: 2 },
      { id: 't_crumb', name: 'Crumb fire damage', sym: ['Smells of burning', 'Barely warms'], t: { power: 'on', cont: 'scorched', lever: 'fine', timer: 'fine' }, parts: ['crumbtray', 'element'], hours: 5, diff: 2 },
      { id: 't_cord', name: 'Damaged cord', sym: ['Dead', 'Works if you wiggle it'], t: { power: 'flickers', cont: 'cord open', lever: 'fine', timer: 'n/a' }, parts: ['cord'], hours: 4, diff: 1 },
      { id: 't_switch', name: 'Worn lever switch', sym: ['Works if you wiggle it', "Won't stay down"], t: { power: 'intermittent', cont: 'switch open', lever: 'loose', timer: 'fine' }, parts: ['switch'], hours: 3, diff: 1 },
      { id: 't_jam', name: 'Carriage jammed', sym: ['Toast stuck', "Won't pop up"], t: { power: 'on', cont: 'fine', lever: 'binds', timer: 'fine' }, parts: [], hours: 2, diff: 1 }
    ] },
  { id: 'radio', name: 'Radio', icon: '📻', replace: [25, 200], unlockCost: 260, tests: { power: 'Power test', cont: 'Continuity check', speaker: 'Speaker test', tune: 'Tuning sweep' },
    faults: [
      { id: 'r_fuse', name: 'Blown fuse', sym: ['Dead', 'Went with a pop'], t: { power: 'dead', cont: 'fuse open', speaker: 'n/a', tune: 'n/a' }, parts: ['fuse'], hours: 2, diff: 1 },
      { id: 'r_psu', name: 'Power supply capacitors', sym: ['Hums loudly', 'Dead'], t: { power: 'hum', cont: 'fine', speaker: 'hum', tune: 'fine' }, parts: ['cap'], hours: 6, diff: 3 },
      { id: 'r_speaker', name: 'Torn speaker cone', sym: ['Crackles', 'Buzzes on bass'], t: { power: 'on', cont: 'fine', speaker: 'rattles', tune: 'fine' }, parts: ['speaker'], hours: 4, diff: 2 },
      { id: 'r_pot', name: 'Scratchy volume pot', sym: ['Crackles', 'Cuts out'], t: { power: 'on', cont: 'fine', speaker: 'crackle on turn', tune: 'fine' }, parts: ['pot'], hours: 3, diff: 1 },
      { id: 'r_dial', name: 'Snapped dial cord', sym: ['Dial does not move', 'Stuck on one station'], t: { power: 'on', cont: 'fine', speaker: 'fine', tune: 'pointer stuck' }, parts: ['dial'], hours: 4, diff: 2 },
      { id: 'r_antenna', name: 'Broken antenna', sym: ['Weak reception', 'Stuck on one station'], t: { power: 'on', cont: 'antenna open', speaker: 'fine', tune: 'weak' }, parts: ['antenna'], hours: 2, diff: 1 },
      { id: 'r_cord', name: 'Mains cord', sym: ['Dead', 'Cuts out'], t: { power: 'flickers', cont: 'cord open', speaker: 'n/a', tune: 'n/a' }, parts: ['cord'], hours: 4, diff: 1 },
      { id: 't_cap', name: 'Dried tuning capacitor', sym: ['Weak reception', 'Drifts off station'], t: { power: 'on', cont: 'fine', speaker: 'fine', tune: 'drifts' }, parts: ['cap'], hours: 7, diff: 3 },
      { id: 'r_switch', name: 'Band switch dirty', sym: ['Stuck on one station', 'Cuts out'], t: { power: 'on', cont: 'switch open', speaker: 'fine', tune: 'one band only' }, parts: ['switch'], hours: 3, diff: 2 },
      { id: 'r_solder', name: 'Cracked solder joint', sym: ['Cuts out', 'Buzzes on bass'], t: { power: 'on', cont: 'intermittent', speaker: 'cuts out', tune: 'fine' }, parts: [], hours: 5, diff: 3 }
    ] },
  { id: 'bike', name: 'Bicycle', icon: '🚲', replace: [120, 600], unlockCost: 320, tests: { spin: 'Spin the wheels', brake: 'Brake pull', drive: 'Drivetrain check', frame: 'Frame & bearings' },
    faults: [
      { id: 'b_puncture', name: 'Puncture', sym: ['Flat tyre', 'Goes flat overnight'], t: { spin: 'fine', brake: 'fine', drive: 'fine', frame: 'tube holed' }, parts: ['tube'], hours: 1, diff: 1 },
      { id: 'b_tyre', name: 'Worn tyre', sym: ['Goes flat overnight', 'Keeps puncturing'], t: { spin: 'wobble', brake: 'fine', drive: 'fine', frame: 'tyre cracked' }, parts: ['tyre', 'tube'], hours: 2, diff: 1 },
      { id: 'b_chain', name: 'Stretched chain', sym: ['Slips under load', 'Grinds'], t: { spin: 'fine', brake: 'fine', drive: 'chain stretched', frame: 'fine' }, parts: ['chain'], hours: 2, diff: 1 },
      { id: 'b_cassette', name: 'Worn cassette', sym: ['Slips under load', 'Noisy in top gear'], t: { spin: 'fine', brake: 'fine', drive: 'teeth hooked', frame: 'fine' }, parts: ['chain', 'gear'], hours: 3, diff: 2 },
      { id: 'b_pads', name: 'Brake pads gone', sym: ['Weak brakes', 'Squeals'], t: { spin: 'fine', brake: 'no bite', drive: 'fine', frame: 'fine' }, parts: ['brakepads'], hours: 1, diff: 1 },
      { id: 'b_cable', name: 'Seized cable', sym: ['Weak brakes', 'Gears will not shift'], t: { spin: 'fine', brake: 'lever stiff', drive: 'shifter stiff', frame: 'fine' }, parts: ['cable'], hours: 2, diff: 1 },
      { id: 'b_hub', name: 'Hub bearings', sym: ['Grinds', 'Wheel wobbles'], t: { spin: 'rough', brake: 'fine', drive: 'fine', frame: 'hub play' }, parts: ['bearing'], hours: 4, diff: 2 },
      { id: 'b_spokes', name: 'Broken spokes', sym: ['Wheel wobbles', 'Squeals'], t: { spin: 'wobble', brake: 'rubs', drive: 'fine', frame: 'spokes loose' }, parts: ['spoke'], hours: 3, diff: 2 },
      { id: 'b_bb', name: 'Bottom bracket', sym: ['Grinds', 'Creaks when pedalling'], t: { spin: 'fine', brake: 'fine', drive: 'crank play', frame: 'creak' }, parts: ['bearing'], hours: 4, diff: 3 },
      { id: 'b_pedal', name: 'Pedal bearings', sym: ['Creaks when pedalling', 'Squeals'], t: { spin: 'fine', brake: 'fine', drive: 'pedal rough', frame: 'fine' }, parts: ['pedal'], hours: 1, diff: 1 },
      { id: 'b_derail', name: 'Bent derailleur', sym: ['Gears will not shift', 'Noisy in top gear'], t: { spin: 'fine', brake: 'fine', drive: 'hanger bent', frame: 'fine' }, parts: ['gear'], hours: 3, diff: 2 },
      { id: 'b_headset', name: 'Loose headset', sym: ['Wheel wobbles', 'Creaks when pedalling'], t: { spin: 'fine', brake: 'judders', drive: 'fine', frame: 'steering play' }, parts: ['bearing'], hours: 2, diff: 2 }
    ] },
  { id: 'console', name: 'Games console', icon: '🎮', replace: [150, 450], unlockCost: 520, tests: { power: 'Power test', video: 'Video output', fan: 'Thermal check', input: 'Controller & drive' },
    faults: [
      { id: 'c_psu', name: 'Power supply failed', sym: ['Dead', 'Clicks and dies'], t: { power: 'no rail', video: 'n/a', fan: 'n/a', input: 'n/a' }, parts: ['psu'], hours: 4, diff: 2 },
      { id: 'c_hdmi', name: 'Cracked video port', sym: ['No picture', 'Picture if you wiggle the cable'], t: { power: 'on', video: 'intermittent', fan: 'fine', input: 'fine' }, parts: ['hdmi'], hours: 6, diff: 3 },
      { id: 'c_fan', name: 'Seized fan', sym: ['Shuts down when hot', 'Sounds like a hairdryer'], t: { power: 'on', video: 'fine', fan: 'fan stalled', input: 'fine' }, parts: ['fan'], hours: 3, diff: 1 },
      { id: 'c_paste', name: 'Dried thermal paste', sym: ['Shuts down when hot', 'Clicks and dies'], t: { power: 'on', video: 'fine', fan: 'runs hot', input: 'fine' }, parts: ['paste'], hours: 4, diff: 2 },
      { id: 'c_drift', name: 'Stick drift', sym: ['Character walks by itself', 'Controller not responding'], t: { power: 'on', video: 'fine', fan: 'fine', input: 'stick wanders' }, parts: ['stick'], hours: 3, diff: 2 },
      { id: 'c_drive', name: 'Disc drive laser', sym: ['Will not read discs', 'Grinds on disc'], t: { power: 'on', video: 'fine', fan: 'fine', input: 'no read' }, parts: ['drive'], hours: 4, diff: 2 },
      { id: 'c_dust', name: 'Dust choked', sym: ['Sounds like a hairdryer', 'Shuts down when hot'], t: { power: 'on', video: 'fine', fan: 'clogged', input: 'fine' }, parts: ['paste'], hours: 2, diff: 1 },
      { id: 'c_button', name: 'Power button flex', sym: ['Dead', 'Controller not responding'], t: { power: 'rail ok', video: 'n/a', fan: 'n/a', input: 'button dead' }, parts: ['button'], hours: 3, diff: 2 },
      { id: 'c_capv', name: 'Video capacitors', sym: ['No picture', 'Picture rolls'], t: { power: 'on', video: 'noisy', fan: 'fine', input: 'fine' }, parts: ['cap'], hours: 6, diff: 3 },
      { id: 'c_belt', name: 'Drive tray belt', sym: ['Grinds on disc', 'Tray stuck'], t: { power: 'on', video: 'fine', fan: 'fine', input: 'tray slips' }, parts: ['belt'], hours: 2, diff: 1 }
    ] },
  { id: 'phone', name: 'Phone', icon: '📱', replace: [120, 900], unlockCost: 700, tests: { power: 'Charge test', screen: 'Screen test', port: 'Port inspection', audio: 'Audio test' },
    faults: [
      { id: 'p_battery', name: 'Swollen battery', sym: ['Dies at 40%', 'Back is lifting'], t: { power: 'drains fast', screen: 'fine', port: 'fine', audio: 'fine' }, parts: ['battery'], hours: 2, diff: 2 },
      { id: 'p_port', name: 'Worn charging port', sym: ['Charges if you hold the cable', 'Will not charge'], t: { power: 'intermittent', screen: 'fine', port: 'loose', audio: 'fine' }, parts: ['port'], hours: 4, diff: 3 },
      { id: 'p_lint', name: 'Lint in port', sym: ['Will not charge', 'Charges if you hold the cable'], t: { power: 'intermittent', screen: 'fine', port: 'packed with fluff', audio: 'fine' }, parts: [], hours: 1, diff: 1 },
      { id: 'p_screen', name: 'Cracked screen', sym: ['Glass cracked', 'Touch dead in a stripe'], t: { power: 'fine', screen: 'cracked', port: 'fine', audio: 'fine' }, parts: ['screen'], hours: 3, diff: 2 },
      { id: 'p_digit', name: 'Digitiser failed', sym: ['Touch dead in a stripe', 'Ghost touches'], t: { power: 'fine', screen: 'touch map broken', port: 'fine', audio: 'fine' }, parts: ['screen'], hours: 3, diff: 3 },
      { id: 'p_speaker', name: 'Blown speaker', sym: ['No sound on calls', 'Crackly audio'], t: { power: 'fine', screen: 'fine', port: 'fine', audio: 'speaker dead' }, parts: ['speaker'], hours: 2, diff: 2 },
      { id: 'p_mic', name: 'Microphone dead', sym: ['Nobody can hear me', 'Crackly audio'], t: { power: 'fine', screen: 'fine', port: 'fine', audio: 'mic dead' }, parts: ['mic'], hours: 3, diff: 3 },
      { id: 'p_button', name: 'Power button', sym: ['Will not wake', 'Back is lifting'], t: { power: 'charges', screen: 'fine', port: 'fine', audio: 'fine' }, parts: ['button'], hours: 3, diff: 2 },
      { id: 'p_water', name: 'Water damage', sym: ['Dies at 40%', 'Ghost touches'], t: { power: 'erratic', screen: 'tide marks', port: 'corroded', audio: 'crackle' }, parts: ['battery', 'port'], hours: 6, diff: 4 },
      { id: 'p_soft', name: 'Software bootloop', sym: ['Will not wake', 'Dies at 40%'], t: { power: 'charges', screen: 'logo loop', port: 'fine', audio: 'fine' }, parts: [], hours: 2, diff: 2 }
    ] },
  { id: 'sewing', name: 'Sewing machine', icon: '🧵', replace: [90, 400], unlockCost: 480, tests: { power: 'Motor test', hand: 'Hand-wheel turn', thread: 'Threading check', stitch: 'Test stitch' },
    faults: [
      { id: 's_needle', name: 'Bent needle', sym: ['Skips stitches', 'Clunks'], t: { power: 'fine', hand: 'fine', thread: 'fine', stitch: 'skips' }, parts: ['needle'], hours: 1, diff: 1 },
      { id: 's_timing', name: 'Hook timing out', sym: ['Skips stitches', 'Thread shreds'], t: { power: 'fine', hand: 'hook late', thread: 'fine', stitch: 'skips every third' }, parts: [], hours: 5, diff: 4 },
      { id: 's_bobbin', name: 'Damaged bobbin case', sym: ['Birds-nest underneath', 'Thread shreds'], t: { power: 'fine', hand: 'fine', thread: 'bobbin catches', stitch: 'loops under' }, parts: ['bobbin'], hours: 2, diff: 2 },
      { id: 's_tension', name: 'Tension discs gummed', sym: ['Birds-nest underneath', 'Loose top thread'], t: { power: 'fine', hand: 'fine', thread: 'no tension', stitch: 'loops under' }, parts: [], hours: 2, diff: 2 },
      { id: 's_belt', name: 'Perished belt', sym: ['Motor runs, needle still', 'Slow and weak'], t: { power: 'motor spins', hand: 'free', thread: 'fine', stitch: 'none' }, parts: ['belt'], hours: 2, diff: 1 },
      { id: 's_motor', name: 'Motor brushes', sym: ['Slow and weak', 'Smells hot'], t: { power: 'sparks', hand: 'fine', thread: 'fine', stitch: 'stalls' }, parts: ['motor'], hours: 5, diff: 3 },
      { id: 's_pedal', name: 'Foot pedal', sym: ['Dead', 'Runs full speed only'], t: { power: 'no control', hand: 'fine', thread: 'fine', stitch: 'none' }, parts: ['switch', 'cord'], hours: 3, diff: 2 },
      { id: 's_gear', name: 'Cracked nylon gear', sym: ['Clunks', 'Motor runs, needle still'], t: { power: 'fine', hand: 'slips', thread: 'fine', stitch: 'none' }, parts: ['gear'], hours: 6, diff: 4 },
      { id: 's_foot', name: 'Worn presser foot', sym: ['Fabric will not feed', 'Loose top thread'], t: { power: 'fine', hand: 'fine', thread: 'fine', stitch: 'no feed' }, parts: ['foot'], hours: 1, diff: 1 },
      { id: 's_lint', name: 'Lint in feed dogs', sym: ['Fabric will not feed', 'Clunks'], t: { power: 'fine', hand: 'stiff', thread: 'fine', stitch: 'no feed' }, parts: [], hours: 1, diff: 1 }
    ] }
];

const SUPPLIERS = [
  { id: 'bulk', name: 'Thrift Components', lead: 3, priceMult: 0.7, quality: 0.85, desc: 'Cheap, slow, and the quality is a lottery. Three weeks by sea.' },
  { id: 'std', name: 'Dependable Parts Co.', lead: 1, priceMult: 1.0, quality: 1.0, desc: 'Next week, every week. The catalogue your predecessor used.' },
  { id: 'rush', name: 'Same-Day Spares', lead: 0, priceMult: 1.7, quality: 1.05, desc: 'A courier on a motorbike. Pays for itself when a deadline is tomorrow.' }
];

const ROLES = [
  { id: 'apprentice', name: 'Apprentice', wage: 110, hours: 36, learn: 1.5, startSkill: 0, desc: 'Keen, cheap, and slow. Learns fastest of anyone on the bench.' },
  { id: 'tech', name: 'Technician', wage: 220, hours: 40, learn: 1.0, startSkill: 2, desc: 'Solid hands. Arrives with two trades at a working level.' },
  { id: 'front', name: 'Front of house', wage: 160, hours: 20, learn: 0.6, startSkill: 0, desc: 'Takes the counter: more customers, better quotes, fewer complaints. Half the bench hours.' },
  { id: 'master', name: 'Master repairer', wage: 380, hours: 40, learn: 0.7, startSkill: 4, desc: 'Fixes anything, teaches everyone. Expensive, and worth it.' }
];
const STAFF_NAMES = ['Priya', 'Dev', 'Ola', 'Marek', 'Jun', 'Safiya', 'Tomasz', 'Ayo', 'Bea', 'Kemal', 'Rosa', 'Lars', 'Nadia', 'Femi', 'Iris', 'Gus'];

/* Street blocks. Customers per week scale with reputation there. */
const BLOCKS = [
  { id: 'hollow', name: 'Hollow Lane', rent: 60, base: 5.0, cost: 0, needRep: 0, desc: 'Your street. A bakery, a launderette, a bus stop, and you.' },
  { id: 'market', name: 'Market Row', rent: 130, base: 6.0, cost: 900, needRep: 45, desc: 'Stalls on Saturdays, pubs on Fridays. Everybody passes through.' },
  { id: 'estate', name: 'Weavers Estate', rent: 70, base: 5.0, cost: 600, needRep: 35, desc: 'Flats and families. Not much money, a lot of things worth keeping.' },
  { id: 'station', name: 'Station Approach', rent: 190, base: 7.0, cost: 1800, needRep: 60, desc: 'Commuters with cracked phones and no time. Deadlines matter here.' },
  { id: 'hill', name: 'Orchard Hill', rent: 230, base: 4.0, cost: 2600, needRep: 70, desc: 'Old houses, old radios, old sewing machines. They pay for care.' }
];
const ADJ = { hollow: ['market', 'estate'], market: ['hollow', 'station'], estate: ['hollow', 'hill'], station: ['market', 'hill'], hill: ['estate', 'station'] };

const CUSTOMER_NAMES = ['Mrs Okafor', 'Dan from the bakery', 'A student', 'Mr Petrov', 'The vicar', 'A courier', 'Two kids with a jar of coins', 'Ms Lindqvist', 'A night-shift nurse', 'Old Mr Haddad', 'A teacher', 'The launderette owner', 'A busker', 'Grandma Chen', 'A man in a suit', 'A woman with a pram', 'The allotment society', 'A DJ', 'A retired engineer', 'A tattooed baker'];
const ITEM_NAMES = { kettle: ['a chrome kettle', 'a dented camping kettle', 'a glass kettle', 'a 1970s whistling kettle'], lamp: ['an anglepoise lamp', 'a brass standard lamp', 'a touch lamp', 'a lava lamp'], toaster: ['a four-slice toaster', 'a wedding-present toaster', 'a retro cream toaster'], radio: ['a valve radio', 'a kitchen DAB radio', 'a transistor radio in a leather case', 'a car radio in a shoebox'], bike: ["a child's bike", 'a cargo bike', 'a racing bike', 'a folding commuter bike', 'a shopping bike with a basket'], console: ['a games console', 'a handheld console', 'a retro console with one controller'], phone: ['a phone', 'a phone with a cracked case', 'a work phone'], sewing: ['a hand-crank sewing machine', 'an overlocker', 'a treadle machine', 'a modern sewing machine'] };

/* Story arcs: 12 customers, 3 beats each. Beats fire on a week window plus a condition. Choices change rep, cash, flags. */
const ARCS = [
  { id: 'okafor', name: "Mrs Okafor's radio", beats: [
    { week: [1, 4], cat: 'radio', item: "her late husband's valve radio", attach: 1, text: 'Mrs Okafor sets a walnut valve radio on the counter like it might break from being looked at. "It was Samuel\'s. It hums. I don\'t want it loud. I want it to hum less."', choices: [{ label: 'Take it on, carefully', eff: { flag: 'okafor_job', rep: 2, log: 'Took Mrs Okafor\'s radio. The whole street knows that radio.' } }, { label: 'Suggest she keep it as it is', eff: { rep: -1, log: 'Sent Mrs Okafor home with her humming radio. She thanked you, which was worse.' } }] },
    { week: [8, 14], cond: 'flag:okafor_job', text: 'Mrs Okafor is back with a tin of biscuits and a neighbour. "This is Grace. Her kettle." Grace has brought three kettles.', choices: [{ label: 'Welcome Grace and the kettles', eff: { rep: 4, cash: 20, flag: 'okafor_referral', log: 'Mrs Okafor sent Grace. Grace sent everyone.' } }] },
    { week: [100, 130], cond: 'flag:okafor_referral', text: 'A card from Mrs Okafor\'s daughter. Mrs Okafor died in the spring. "The radio was on. It did not hum. She asked us to tell you."', choices: [{ label: 'Put the card above the bench', eff: { rep: 3, flag: 'okafor_card', log: 'The card from the Okafors is above the bench now. It stays.' } }] }
  ] },
  { id: 'courier', name: 'The courier', beats: [
    { week: [2, 6], cat: 'bike', item: 'a cargo bike held together with zip ties', attach: 0.6, text: 'A courier, sweating, holds up a bike with a grinding noise and no time. "I lose the day if I lose the bike. Whatever it costs, today."', choices: [{ label: 'Promise it today and rush the parts', eff: { flag: 'courier_rush', rep: 2, log: 'Rushed the courier\'s bike through. He tipped in energy bars.' } }, { label: 'Promise it properly, next week', eff: { flag: 'courier_slow', rep: -1, log: 'Told the courier the truth: a week. He went elsewhere and came back a week later anyway.' } }] },
    { week: [20, 40], cond: 'flag:courier_rush', text: 'The courier brings four other couriers. Their company has no workshop and no patience. "Fleet rate?"', choices: [{ label: 'Offer a fleet rate', eff: { cash: 150, rep: 3, flag: 'fleet', log: 'Fleet contract with the couriers. Every Monday, something with a chain.' } }, { label: 'Full price, no favours', eff: { cash: 60, log: 'The couriers pay full price and keep coming anyway.' } }] },
    { week: [120, 150], cond: 'flag:fleet', text: 'The courier company has been bought by an app. The app has a "preferred repair partner". It is not you. The courier shrugs: "I still come here. They don\'t pay for my lunch either."', choices: [{ label: 'Keep fixing his bike at cost', eff: { rep: 5, cash: -40, flag: 'courier_loyal', log: 'The app has a repair partner. The couriers have you.' } }] }
  ] },
  { id: 'school', name: 'The school kettle', beats: [
    { week: [3, 7], cat: 'kettle', item: 'the staff-room kettle', attach: 0.3, text: 'A teacher with chalk on her sleeve and the staff-room kettle. "The budget line for this is zero. The staff morale line is also zero."', choices: [{ label: 'Fix it for free', eff: { cash: -10, rep: 3, flag: 'school_free', log: 'Fixed the school kettle for nothing. Thirty teachers now know your name.' } }, { label: 'Charge the normal rate', eff: { cash: 25, log: 'Charged the school for the kettle. The teacher paid from her own purse.' } }] },
    { week: [30, 50], cond: 'flag:school_free', text: 'The school wants a repair club: one afternoon a week, year sevens, screwdrivers. "They\'ll break things. That\'s the point."', choices: [{ label: 'Run the club', eff: { rep: 6, flag: 'club', log: 'Repair club on Thursdays. Eleven-year-olds, one kettle, no casualties yet.' } }, { label: 'No time', eff: { log: 'Declined the repair club. The teacher understood. The year sevens did not.' } }] },
    { week: [110, 140], cond: 'flag:club', text: 'One of the repair-club kids is sixteen now and standing in the doorway with a CV she wrote herself. The last line says "can fix toasters, mostly".', choices: [{ label: 'Hire her as an apprentice', eff: { hire: 'apprentice', flag: 'club_hire', rep: 3, log: 'Hired a repair-club kid. She fixed a toaster on day one, mostly.' } }, { label: 'Write her a reference instead', eff: { rep: 1, log: 'Wrote the repair-club kid a reference. Somebody else will hire her, and be lucky.' } }] }
  ] },
  { id: 'dj', name: 'The DJ', beats: [
    { week: [6, 12], cat: 'radio', item: 'a valve amplifier with a cigarette burn', attach: 0.8, text: 'A DJ in a coat that cost more than your rent. "It\'s a valve amp. The sound is warm. The sound is also, currently, nothing."', choices: [{ label: 'Take it on', eff: { flag: 'dj_job', log: 'The DJ\'s amp is on the bench. It is warm, apparently.' } }, { label: 'Refer him to a specialist', eff: { rep: 1, log: 'Sent the DJ to a specialist. He came back: the specialist retired.' } }] },
    { week: [40, 60], cond: 'flag:dj_job', text: 'The DJ has posted about you. A lot. There is a queue of people with turntables and the word "vintage" in their mouths.', choices: [{ label: 'Lean into vintage audio', eff: { rep: 4, cash: 100, flag: 'vintage', log: 'Vintage audio is a thing now. Your bench smells of flux and nostalgia.' } }, { label: 'Serve the queue, change nothing', eff: { cash: 60, log: 'Served the vintage queue and went back to kettles.' } }] },
    { week: [130, 150], cond: 'flag:vintage', text: 'The DJ wants to put your name on a record sleeve: "Repairs by —". He also wants a discount forever.', choices: [{ label: 'Name on the sleeve, no discount', eff: { rep: 4, log: 'Your name is on a record sleeve. Full price, still.' } }, { label: 'Discount forever', eff: { rep: 2, cash: -80, log: 'The DJ has a discount forever. He has a lot of amps.' } }] }
  ] },
  { id: 'landlord', name: 'The landlord', beats: [
    { week: [10, 16], text: 'Your landlord, in person, which is never good. "Rent\'s going up in the new year. Twenty percent. The street\'s coming up. You\'re part of why. Congratulations."', choices: [{ label: 'Negotiate: a longer lease for a smaller rise', eff: { flag: 'lease', cash: -200, log: 'Signed a longer lease at a ten percent rise. Paid a deposit you did not have.' } }, { label: 'Accept the rise', eff: { flag: 'rent_up', log: 'Rent up twenty percent in the new year. The street is coming up. You are not.' } }] },
    { week: [60, 80], cond: 'flag:rent_up', text: 'The landlord again. A chain café wants the unit next door and yours. "Numbers are numbers."', choices: [{ label: 'Match the offer', eff: { cash: -600, rep: 2, flag: 'held_unit', log: 'Matched the chain\'s offer to keep the unit. Numbers are numbers.' } }, { label: 'Move to a cheaper unit on the estate', eff: { flag: 'moved', rep: -3, cash: 200, log: 'Moved to the estate. Cheaper, further, and the regulars found you anyway.' } }] },
    { week: [60, 80], cond: 'flag:lease', text: 'The landlord, with a bottle of wine. The chain café wanted your unit; the lease said no. "I\'d have taken the money. Glad I couldn\'t."', choices: [{ label: 'Share the wine', eff: { rep: 2, log: 'The landlord shared a bottle of wine over the bench. The lease held.' } }] }
  ] },
  { id: 'nurse', name: 'The night nurse', beats: [
    { week: [12, 20], cat: 'phone', item: 'a phone with a dead microphone', attach: 0.5, text: 'A nurse in scrubs, after a night shift. "Nobody on the ward can hear me on it. I need it by tonight or I\'m buying a new one I can\'t afford."', choices: [{ label: 'Do it today', eff: { flag: 'nurse_today', rep: 3, log: 'Fixed the nurse\'s phone between shifts. She slept in the chair while you did it.' } }, { label: 'Tomorrow is the earliest', eff: { rep: -2, log: 'Could not do the nurse\'s phone today. She bought a new one on credit.' } }] },
    { week: [50, 70], cond: 'flag:nurse_today', text: 'The nurse brings the ward\'s box of dead phones, kettles and a radio. "The hospital would throw these out. The hospital throws everything out."', choices: [{ label: 'Fix the box for the ward', eff: { cash: -60, rep: 6, flag: 'ward', log: 'Fixed a box of ward things for the cost of parts. The hospital threw out a letter of thanks; the nurse rescued it.' } }, { label: 'Quote the hospital properly', eff: { cash: 220, log: 'Quoted the hospital for the box. They paid, eventually, in triplicate.' } }] },
    { week: [125, 150], cond: 'flag:ward', text: 'The hospital trust wants a contract: every ward, every device, a van. It is a lot of money and a lot of forms.', choices: [{ label: 'Take the contract', eff: { cash: 800, flag: 'nhs_contract', log: 'Signed the hospital contract. A van, a lanyard, a different kind of shop.' } }, { label: 'Stay a shop', eff: { rep: 3, log: 'Turned down the hospital contract. The nurse still brings the ward box.' } }] }
  ] },
  { id: 'kids', name: 'The jar of coins', beats: [
    { week: [5, 10], cat: 'console', item: 'a games console with a jar of coins on top', attach: 0.9, text: 'Two kids with a console and a jar of coins. "It\'s our dad\'s. He\'s not here. It won\'t turn on. We counted it twice."', choices: [{ label: 'Count the jar and call it enough', eff: { cash: 12, rep: 4, flag: 'jar', log: 'Two kids, one console, a jar of coins. Called it enough.' } }, { label: 'Fix it free, keep the jar for them', eff: { cash: -15, rep: 5, flag: 'jar', log: 'Fixed the kids\' console. Gave the jar back. They did not understand and left it on the counter.' } }] },
    { week: [45, 65], cond: 'flag:jar', text: 'The kids are back, taller, with a controller that drifts and a drawing of the shop. The drawing has you in it, enormous.', choices: [{ label: 'Fix the controller, frame the drawing', eff: { rep: 3, flag: 'drawing', log: 'The drawing of the shop is on the wall. You are enormous in it.' } }] },
    { week: [135, 155], cond: 'flag:drawing', text: 'The older kid, fifteen, wants to know if the console job was ever actually paid for. He has a part-time job now. He has brought the difference.', choices: [{ label: 'Refuse the money, offer Saturdays', eff: { rep: 4, flag: 'kid_saturdays', log: 'Refused the kid\'s money and offered him Saturdays on the bench. He took the Saturdays.' } }, { label: 'Take it, it\'s his to give', eff: { cash: 40, rep: 2, log: 'Took the kid\'s money because it was his to give. He stood straighter.' } }] }
  ] },
  { id: 'engineer', name: 'The retired engineer', beats: [
    { week: [15, 25], cat: 'sewing', item: 'a treadle sewing machine from 1911', attach: 1, text: 'A retired engineer with a machine from 1911 and opinions. "The timing\'s out. I could do it myself. My hands disagree."', choices: [{ label: 'Let him supervise from a chair', eff: { flag: 'engineer', rep: 2, log: 'Fixed the 1911 treadle with an engineer narrating. The timing is in. So are his opinions.' } }, { label: 'Politely, no spectators', eff: { log: 'No spectators. The engineer waited outside, reading the notice in the window.' } }] },
    { week: [55, 75], cond: 'flag:engineer', text: 'The engineer has started turning up anyway, with a flask. He has quietly taught the apprentice three things you did not know.', choices: [{ label: 'Give him a bench and a title', eff: { flag: 'engineer_bench', train: 1, log: 'The engineer has a bench and the title "Consultant". Everybody is better at radios now.' } }, { label: 'Thank him and keep it a shop', eff: { rep: 1, log: 'Thanked the engineer. He still comes. The flask is bottomless.' } }] },
    { week: [128, 150], cond: 'flag:engineer_bench', text: 'The engineer leaves a box of his tools on the bench with a note: "Hands disagree. Tools don\'t." He does not come in again.', choices: [{ label: 'Keep the tools in use', eff: { rep: 3, train: 1, log: 'The engineer\'s tools are in daily use. That is what he wanted.' } }] }
  ] },
  { id: 'baker', name: 'Dan from the bakery', beats: [
    { week: [4, 9], cat: 'toaster', item: 'a four-slice toaster from the bakery', attach: 0.2, text: 'Dan from the bakery, with flour on him and a toaster. "Twelve of these a year I bin. Twelve. Can you not?"', choices: [{ label: 'Fix it, and offer a standing arrangement', eff: { flag: 'baker', rep: 2, log: 'Dan\'s toaster fixed. Standing arrangement: his broken things, your bench, bread on Fridays.' } }, { label: 'Fix it, one-off', eff: { cash: 20, log: 'Fixed Dan\'s toaster. One-off. He binned the next one.' } }] },
    { week: [35, 55], cond: 'flag:baker', text: 'Dan puts a sign in the bakery window: "Broken? Try next door first." Your intake doubles for a fortnight.', choices: [{ label: 'Send him a cake back', eff: { rep: 5, cash: -20, log: 'Dan\'s sign sent half the street in. Sent him a cake, which he said was "fine for a repair shop".' } }] },
    { week: [115, 145], cond: 'flag:baker', text: 'Dan is selling the bakery. The buyer is a chain. "They\'ll bin everything. Thought you should know. Thought you might want the mixer."', choices: [{ label: 'Buy the mixer and keep it running', eff: { cash: -150, rep: 3, flag: 'mixer', log: 'Bought Dan\'s mixer before the chain could bin it. It runs. It is enormous.' } }, { label: 'Let it go', eff: { log: 'Let Dan\'s mixer go. The chain binned it in week one.' } }] }
  ] },
  { id: 'council', name: 'The council', beats: [
    { week: [25, 35], text: 'A council officer with a lanyard and a leaflet about "circular economy". She would like you on a panel. There is no fee. There is a photo.', choices: [{ label: 'Join the panel', eff: { rep: 3, flag: 'panel', log: 'Joined the council\'s circular-economy panel. There was a photo. You look tired in it.' } }, { label: 'Decline', eff: { log: 'Declined the council panel. The leaflet is in the recycling.' } }] },
    { week: [70, 90], cond: 'flag:panel', text: 'The council has a grant: "Right to Repair Hub". Enough for benches and a sign. The sign would have the council logo on it, larger than yours.', choices: [{ label: 'Take the grant', eff: { cash: 1200, bench: 1, flag: 'grant', log: 'Took the council grant. New benches. The logo on the sign is, indeed, larger than yours.' } }, { label: 'Decline, keep the sign yours', eff: { rep: 2, log: 'Declined the grant. The sign is yours. The benches are old.' } }] },
    { week: [130, 155], cond: 'flag:grant', text: 'The council wants to "scale the hub model" across the borough, with you as "delivery partner". It is a chain with extra forms.', choices: [{ label: 'Become the delivery partner', eff: { cash: 600, flag: 'council_chain', log: 'Delivery partner for the borough. The forms have forms.' } }, { label: 'Stay one hub', eff: { rep: 3, log: 'Stayed one hub. The council found another delivery partner, who lasted a year.' } }] }
  ] },
  { id: 'chen', name: 'Grandma Chen', beats: [
    { week: [18, 28], cat: 'lamp', item: 'a paper lantern lamp', attach: 0.9, text: 'Grandma Chen, with a lamp made of paper and wire that is older than the shop. Her grandson translates: "It is from the wedding. It flickers. She says flickering is bad luck."', choices: [{ label: 'Fix it and explain every step', eff: { flag: 'chen', rep: 3, log: 'Fixed Grandma Chen\'s wedding lamp with her grandson translating every step. No more flickering. Good luck restored.' } }, { label: 'Say the wiring is too old to touch', eff: { rep: -2, log: 'Told Grandma Chen the lamp was too old to touch. She touched your arm, kindly, and left.' } }] },
    { week: [60, 85], cond: 'flag:chen', text: 'The grandson is back alone. He wants to learn. He has already fixed his own phone from a video and it half works.', choices: [{ label: 'Take him on Saturdays', eff: { flag: 'chen_grandson', train: 1, rep: 2, log: 'Grandma Chen\'s grandson does Saturdays now. His phone fully works.' } }, { label: 'Recommend the college course', eff: { log: 'Sent the grandson to the college course. He sends photos of circuit boards.' } }] },
    { week: [120, 150], cond: 'flag:chen_grandson', text: 'Grandma Chen\'s hundredth birthday. The lamp is lit. The grandson has brought a plate of food that will not fit on the bench.', choices: [{ label: 'Close early and go', eff: { cash: -50, rep: 5, log: 'Closed early for Grandma Chen\'s hundredth. The lamp was lit. It did not flicker.' } }] }
  ] },
  { id: 'rival', name: 'The rival', beats: [
    { week: [40, 55], text: 'A new shop on Market Row: "FixFast". Neon sign, forty-minute phone screens, a franchise manual. The manager comes in to "say hello" and count your benches.', choices: [{ label: 'Compete on care, not speed', eff: { flag: 'rival_care', rep: 2, log: 'FixFast opened on Market Row. You are competing on care. They are competing on neon.' } }, { label: 'Match them: faster, cheaper', eff: { flag: 'rival_fast', cash: -100, log: 'Matched FixFast on speed. The bench is louder and the quality is thinner.' } }] },
    { week: [80, 100], cond: 'flag:rival_care', text: 'FixFast\'s customers are coming to you with FixFast\'s repairs. Glued screens. Wrong batteries. "Can you make it how it was?"', choices: [{ label: 'Fix their mistakes, charge fairly', eff: { rep: 5, cash: 120, log: 'A steady trade in fixing FixFast\'s fixes. Fairly charged, quietly satisfying.' } }, { label: 'Fix them and say nothing', eff: { rep: 3, cash: 120, log: 'Fixed FixFast\'s fixes and said nothing about it. People noticed anyway.' } }] },
    { week: [120, 145], cond: 'flag:rival_care', text: 'FixFast has closed. The manager is at your counter with a box of their stock and no neon. "Franchise pulled out. Want the parts? Want a technician?"', choices: [{ label: 'Buy the stock and hire him', eff: { cash: -300, hire: 'tech', flag: 'rival_hired', log: 'Bought FixFast\'s stock and hired its manager. He is good, it turns out, when nobody is timing him.' } }, { label: 'Buy the stock only', eff: { cash: -200, parts: 30, log: 'Bought FixFast\'s stock. The manager went back to the franchise.' } }] }
  ] },
  { id: 'investor', name: 'The investor', beats: [
    { week: [95, 110], text: 'A man in a suit who has "been watching the space". He uses the word "scale" four times and the word "repair" once. He has a term sheet.', choices: [{ label: 'Hear him out', eff: { flag: 'investor', log: 'Heard the investor out. "Scale" four times. A term sheet on the bench next to the kettle.' } }, { label: 'Show him the door', eff: { rep: 2, log: 'Showed the investor the door. He said you would regret it, warmly.' } }] },
    { week: [120, 135], cond: 'flag:investor', text: 'The investor again, with a plan: five shops, a brand, an app, a van. Your name on all of it, in a font you did not choose.', choices: [{ label: 'Take the money', eff: { cash: 3000, flag: 'funded', rep: -2, log: 'Took the investor\'s money. Five shops on a slide. A font you did not choose.' } }, { label: 'Say no', eff: { rep: 3, flag: 'refused_money', log: 'Said no to the investor. He left the term sheet. It is under the kettle.' } }] },
    { week: [145, 156], cond: 'flag:funded', text: 'The investor wants the ending decided: franchise the model, or he pulls out. The bench is quiet. The street is outside.', choices: [{ label: 'It will be decided at the end of the year', eff: { log: 'Told the investor: the end of the year. He set a reminder.' } }] }
  ] }
];

const ENDINGS = {
  beloved: { title: 'The Shop on Hollow Lane', text: 'Three years. You stayed one bench wide and a street deep. The sign is hand-painted; the window has a drawing in it with you enormous; the regulars come in to talk and leave with something mended. Twelve toasters a year do not go to the landfill, and neither do you. On a Thursday, year sevens break a kettle on purpose, and you show them how to put it right.' },
  empire: { title: 'FixEmpire', text: 'Three years. Five shops, a van, a lanyard, a font you did not choose. Twelve hundred items a week are mended across the borough that would have been binned, and somewhere a spreadsheet says so. You visit Hollow Lane on Fridays. The apprentice runs it now. The card from the Okafors is still above the bench, because she would not let anyone move it.' },
  bust: { title: 'Closing Time', text: 'The numbers were numbers. The landlord was sorry, which helped nobody. The tools went to the repair club at the school, and the bench went to the estate, and somebody will fix a kettle on it this week. The street keeps the sign.' }
};

const DATA = { WEEKS_PER_YEAR, CAMPAIGN_WEEKS, PARTS, CATEGORIES, SUPPLIERS, ROLES, STAFF_NAMES, BLOCKS, ADJ, CUSTOMER_NAMES, ITEM_NAMES, ARCS, ENDINGS };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.REPAIR_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
