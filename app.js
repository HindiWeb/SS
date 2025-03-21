let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installApp').style.display = 'block';
});
function installPWA() {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
        document.getElementById('installApp').style.display = 'none';
    });
}

const Muted = {
    template: '<span class="text-muted mx-1"><slot></slot></span>',
    name: 'Muted'
};
const Bsig = {
    //bootstrap input group
    props: ['text', 'fa'],
    template : `<div class="input-group my-1">
                    <span class="input-group-text">
                        <template v-if="fa"><i :class="'fas fa-' + fa"></i></template>
                        <template v-else-if="text">{{ text }}</template>
                    </span>
                    <slot></slot>
                </div>`,
    name: 'Bsig' 
}
const X = {
    template : `<span class="text-muted mx-1"><i class="bi bi-x"></i></span>`,
    name: 'X'
}

const app = Vue.createApp({
    data() {
        return {
            shape: 'rod',
            material: 'ss304',
            diameter: null,
            outerDiameter: null,
            thickness: null,
            width: null,
            height: null,
            length: null,
            weight: null,
            history: [],
            dimentions: null
            
        };
    },
    components: {
        Muted,
        Bsig,
        X
    },
    computed: {
        density() {
            return this.material === 'ss304' ? 8000 : 7980;
        }
    },
    watch: {
        material() {
            this.calculateWeight(); // Live calculation when material changes
        },
        shape() {
            this.weight = this.calculateWeight(); // Reset weight when shape changes
        },
        diameter() {
            this.calculateWeight(); // Live calculation when diameter changes
        },
        outerDiameter() {
            this.calculateWeight(); // Live calculation when outer diameter changes
        },
        thickness() {
            this.calculateWeight(); // Live calculation when wall thickness changes
        },
        width() {
            this.calculateWeight(); // Live calculation when width changes
        },
        height() {
            this.calculateWeight(); // Live calculation when height changes
        },
        length() {
            this.calculateWeight(); // Live calculation when length changes
        }
    },
    methods: {
        calculateWeight() {
            let volume = 0;
            if (this.shape === 'rod' && this.diameter && this.length) {
                let radius = this.diameter / 2 / 1000;
                volume = Math.PI * Math.pow(radius, 2) * (this.length / 1000); // Volume in m^3
                this.dimentions = "Ø " + this.diameter + " x " + this.length + " mm";
            } else if (this.shape === 'pipe' && this.outerDiameter && this.thickness && this.length) {
                let outerRadius = this.outerDiameter / 2 / 1000;
                let innerRadius = (this.outerDiameter - 2 * this.thickness) / 2 / 1000;
                volume = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * (this.length / 1000); // Volume in m^3
                this.dimentions = "OD " + this.outerDiameter + " x " + this.thickness + " x " + this.length + " mm";
            } else if (this.shape === 'rect' && this.width && this.height && this.length) {
                volume = (this.width / 1000) * (this.height / 1000) * (this.length / 1000); // Volume in m^3
                this.dimentions = this.width + " x " + this.height + " x " + this.length + " mm";
            } else if (this.shape === 'square_pipe' && this.width && this.thickness && this.length) {
                let outerArea = (this.width / 1000) ** 2; 
                let innerWidth = this.width - 2 * this.thickness;
                let innerArea = (innerWidth / 1000) ** 2;
                volume = (outerArea - innerArea) * (this.length / 1000);
                this.dimentions = this.width + " x " + this.thickness + " x " + this.length + " mm";
            }

            this.weight =  volume * this.density; // Weight in kg
            if (this.weight <=0 ) {
                this.weight = null;
            } else if (this.weight < 0) {
                alert("Invalid Input.");
            }
            return this.weight;
        },
        save() {
            var weight = this.weight;
            if (weight === null || weight <= 0) {
                alert("Please calculate the weight first.");
                return;
            }                    
            weight = this.weight.toFixed(2); // Round weight to 2 decimal places
            const date = new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }); // Get current date and time in DD-MMM-YYYY HH:MM:SS

            console.log(date);



            const data = {
                id: Date.now(),
                weight: weight,
                time: date,
                material: this.material,
                shape: this.shape,
                dimentions : this.dimentions
            };
            let history = JSON.parse(localStorage.getItem('history')) || [];
            history.push(data);
            localStorage.setItem('history', JSON.stringify(history));
            this.loadHistory();
        },
        reset() {
            this.shape = 'rod';
            this.material = 'ss304';
            this.diameter = null;
            this.outerDiameter = null;
            this.thickness = null;
            this.width = null;
            this.height = null;
            this.length = null;
            this.weight = null;
        },
        loadHistory() {
            var history = JSON.parse(localStorage.getItem('history')) || [];
            //reverse the history array
            this.history = history.reverse();
            console.log('history',this.history)
        },
        deleteItem(id) {
            console.log(id);
            
            this.history = this.history.filter((item, index) => index !== id);
            localStorage.setItem('history', JSON.stringify(this.history));
        },
        showResult() {
            var w = this.calculateWeight();
            if (!w) {
                //focus the first visible field
                $('input:visible').first().focus();
                return;
            }
            //scroll to the result section
            document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
        }

    },
    mounted() {
        this.loadHistory();
    }
        
    
});
app.mount('#app');



  document.addEventListener("DOMContentLoaded",  () => {
    let calcScreen = document.getElementById("calcScreen");
    let calcKeys = document.getElementById("calcKeys");
    let calcHistory = document.getElementById("calcHistory");

    let buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'];
    let expression = "";
    let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

    function updateHistory() {
      calcHistory.innerHTML = "";
      history.slice(-20).reverse().forEach(entry => {
        let li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = entry;
        calcHistory.appendChild(li);
      });
    }

    function handleCalc(btn) {
      if (btn === "=") {
        try {
          let result = eval(expression);
          let fullExp = expression + " = " + result;
          history.push(fullExp);
          if (history.length > 20) history.shift();
          localStorage.setItem("calcHistory", JSON.stringify(history));
          calcScreen.value = result;
          expression = result.toString();
          updateHistory();
        } catch {
          calcScreen.value = "Error";
          expression = "";
        }
      } else if (btn === "C") {
        expression = "";
        calcScreen.value = "";
      } else {
        expression += btn;
        calcScreen.value = expression;
      }
    }

    buttons.forEach((btn, index) => {
        let button = document.createElement("button");
        button.className = "btn border-primary-subtle m-1 text-center col-2";
        button.textContent = btn;
        if(btn === "="){
            button.className = "btn btn-success btn-outline-primary m-1 text-center text-white col-2 fw-bold";
        }else if(btn === "C"){
            button.classList.add("btn-warning");
        }
        button.onclick = () => handleCalc(btn);
  
        if (index % 4 === 0) {
          let rowDiv = document.createElement("div");
          rowDiv.className = "grid row g-2 ";
          calcKeys.appendChild(rowDiv);
        }
  
        calcKeys.lastElementChild.appendChild(button);
      });

    updateHistory(); // Load history on startup

    window.showCalculator = function(){
        new bootstrap.Modal(document.getElementById('calculatorModal')).show();
    }
    window.clearHistory = function() {
        history = [];
        localStorage.removeItem("calcHistory");
        updateHistory();
    }
      
  });
