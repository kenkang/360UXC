/**
 * @fileoverview Autocomplete class, AutocompleteDataMgr, AutocompleteCache, getScript
 * @author:{@link mailto:ranklau@gmail.com never-online}
 * @update: 2009-1-7
 * �������⣬��IE�ﲻ��mutipleData��ʱ�������Ч
 */


/*
function IDataStruct() {
	return {
		text
		content
		getData
	}
};

function IKeyboard() {
	depend on IDataSource
	return {
		next
		privous
		start
		end
		hide
		show
	}
};

function IDataSource() {
	return {
		formatDataSource
		matchData
		nextEntry
		previousEntry
		gotoEntry
	}
}
*/


var SuggestLayer = function() {
	this.$super.apply(this, arguments);
	return this;
}.$extends(LayerPopup);

SuggestLayer.prototype.autocompleteElements = [];

SuggestLayer.prototype._addLayerPopupListener = function () {
	var instance = this;
	var fnPopupBlurHandler = function(e) { 
		e  = window.event || e;
		var el = BBEvent.target(e);
		
		if (!instance._popup.contains(el) && instance.isVisible()) {
			if (instance.isVisible()) {
				for (var i=0; i<instance.autocompleteElements.length; i++) {
					if (instance.autocompleteElements[i]==el) return;
				}
				CustEvent.fireEvent(instance, 'blur', e);
				instance.hide();
			}
		}
	}

	BBEvent.observe(document, 'mousedown',       fnPopupBlurHandler);
	BBEvent.observe(document, 'keyup',           fnPopupBlurHandler);
}

/* �Զ���ɵ�cache */
function AutocompleteCache() {
	this.cache = {};
	return this;
}

AutocompleteCache.prototype.read = function(key) {
	if (this.cache[key]) return this.cache[key];
	return null;
};

AutocompleteCache.prototype.write = function(key, value) {
	key = key +'';
	if (!this.read(key)) this.cache[key] = value;
}



/**
 * �Զ���ɵ���ʽ����
 * @const
 * @static
 */
var AutocompleteStyle = {
	CONTAINER: 'autocomplete',

	UNSELECTED_ENTRY: 'unselectedentry',
	SELECTED_ENTRY: 'selectedentry',

	UNSELECTED_KEY: 'unselectedkey',
	UNSELECTED_VAL: 'unselectedval',

	SELECTED_KEY: 'selectedkey',
	SELECTED_VAL: 'unselectedval'
};


/**
 * �Զ���ɼ����¼��ӿ�
 */
var AutocompleteKeyMgr = {
	DOWN  : 40,
	UP    : 38,
	ESC   : 27,
	ENTER : 13,
	availableKeyCode: function(keyCode) {
		var invalidKeyCode = [40,39,38,37,27,13,17,16];
		var len = invalidKeyCode.length;
		for (var i=0; i<len; i++) {
			if (invalidKeyCode[i]==keyCode) return false;
		}
		return true;
	}
};


/**
 * �Զ���ɿ��Դ������¼��ӿ�
 * @const
 * @static
 */
var AUTOCOMPLETE_EVENT = {
	SHOW    : 'onshow',
	HIDE    : 'onhide',
	SELECT  : 'onselect',
	CHANGE  : 'onchange',
	INPUT   : 'oninput',
	ENTER   : 'onenter'
};

/**
 * ͨ��script�Ļص�������ʵ�ֿ���
 * @param {string}   value    Ҫ���õ��ı���ֵ���ַ���
 * @param {function} callback ���ű�������ʱ�����Ļص�����
 * @return void
 */
function getScript(url, callback){
	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement("script");
	var done = false;
	script.src = url;

	if(callback)
		script.onload = script.onreadystatechange = function(){
			if ( !done && (!this.readyState ||
				this.readyState == "loaded" || this.readyState == "complete") ) {
					done = true;
					callback();
			}
		};

	head.appendChild(script);
}

/* �Զ���ɵ����ݲ�������
   ������������Ľӿ� */


function AutocompleteDataMgr(op) {
	
	this.tblPrefix = '_table';

	this.tableId = this.tblPrefix +op.instanceName;
	this.instanceName = op.instanceName;
	this.multipleData = op.multipleData || true;

	this.classNames = op.classNames;
	this.dataSource = op.data || [];
	
	/*START:Added by Miller*/
	//��������⣺�ڻ�ƱSuggest�У������������ؿս��ʱ�ڽ�������Ȼ��Ҫ��ʾ���޽��������ʾ
	//���ڸ�����£�������¼���޷�ѡ��ͬʱҲ�޷�ʹ�����°�ť��ѡ�У�������Ӹñ�־λ
	this._selectable = true;
	/*END:Added by Miller*/
	
	return this;
};

AutocompleteDataMgr.prototype.getDataLength = function () {
	return this.dataSource.length;
};

/* string formater */
AutocompleteDataMgr.prototype.format = function(data) {
	this.dataSource = data || this.dataSource;
	var dataLength = this.dataSource.length;
	var strBuilder = [];
	strBuilder.push('<table onselectstart="return false" cellspacing="0" cellpadding="0" border="0" id="' +this.tableId+ '" class="' +this.classNames.CONTAINER+ '" width="100%">');

	for (var i=0; i<dataLength; i++) {
		strBuilder.push('<tr class="' +this.classNames.UNSELECTED_ENTRY+' " onmousedown="' +this.instanceName+ '.mousedownHandler(event, ' +i+ ')" onclick="' +this.instanceName+'.clickHandler(' +i+ ')" onmouseover="' +this.instanceName+ '.overHandler(' +i+ ')" onmouseout="' +this.instanceName+ '.outHandler(' +i+ ')">'
							+'<td class="' +this.classNames.UNSELECTED_KEY+ '">' +(this.dataSource[i].display||this.dataSource[i].key)+ '</td>'
							+(this.multipleData?'<td class="' +this.classNames.UNSELECTED_VAL+ '" align="right">' +this.dataSource[i].val+ '</td>':'')+'</tr>');
	}

	strBuilder.push('</table>');
	return strBuilder.join('');
};

AutocompleteDataMgr.prototype.gotoEntry = function(beforeIndex, afterIndex) {
	var classNames = this.classNames;
	var beforeKeyNode   = this.getKeyNode(beforeIndex);
	var beforeValNode   = this.getValNode(beforeIndex);

	var afterKeyNode    = this.getKeyNode(afterIndex);
	var afterValNode    = this.getValNode(afterIndex);

	var beforeEntryNode = this.getEntryNode(beforeIndex);
	var afterEntryNode  = this.getEntryNode(afterIndex); 

	Dom.replaceClassName( beforeEntryNode, classNames.SELECTED_ENTRY,   classNames.UNSELECTED_ENTRY );		
	Dom.replaceClassName( beforeKeyNode,   classNames.SELECTED_KEY,     classNames.UNSELECTED_KEY   );
	Dom.replaceClassName( beforeValNode,   classNames.SELECTED_VAL,     classNames.UNSELECTED_VAL   );
	Dom.replaceClassName( afterKeyNode,    classNames.UNSELECTED_KEY,   classNames.SELECTED_KEY     );
	Dom.replaceClassName( afterValNode,    classNames.UNSELECTED_VAL,   classNames.SELECTED_VAL     );
	Dom.replaceClassName( afterEntryNode,  classNames.UNSELECTED_ENTRY, classNames.SELECTED_ENTRY   );
};

AutocompleteDataMgr.prototype.clear = function() {
	this.dataSource = {};
};

AutocompleteDataMgr.prototype.getEntryNode = function(n) {
	var tblElement = document.getElementById(this.tableId);
	return n >=0 ? tblElement.rows[n] : null;
};

AutocompleteDataMgr.prototype.getKeyNode = function(n) {
	var element = this.getEntryNode(n);
	return element ? element.cells[0] : null;
};

AutocompleteDataMgr.prototype.getValNode = function(n) {
	var element = this.getEntryNode(n);
	return element ? element.cells[1] : null;
};

AutocompleteDataMgr.prototype.getEntryData = function(n) {
	return this.dataSource[n];
};

AutocompleteDataMgr.prototype.getEntryKey = function(n) {
	return this.getEntryData(n) ? this.getEntryData(n).key : null;
};

AutocompleteDataMgr.prototype.getEntryVal = function(n) {
	return this.getEntryData(n) ? this.getEntryData(n).val : null;
};

AutocompleteDataMgr.prototype.fixIndex = function(n) {
	if (n >= this.getDataLength()) n = -1;
	if (n < -1) n = this.getDataLength()-1;
	return n;
};

/*START:Added by Miller*/
AutocompleteDataMgr.prototype.setSelectable = function(flag) {
	this._selectable = flag;
};
AutocompleteDataMgr.prototype.selectable = function() {
	return this._selectable;
};
/*END:Added by Miller*/


/* �Զ���ɵ�ʵ�� */
function Autocomplete(op) {
	return this._constructor.apply(this, arguments);
}

Autocomplete.prototype = {

	EVENT          : AUTOCOMPLETE_EVENT,

	keyMgr         : AutocompleteKeyMgr,

	classNames     : AutocompleteStyle,

	/** ���� **/
	width          : null,

	/** X���� **/
	left           : null,
	
	/** �߶� **/
	height         : null,

	/** Y���� **/
	top            : null,

	/** ���ݹ����� **/
	dataMgr        : null,
	
	/** ��ѯ��DOM��׼�¼� **/
	queryEventType  : [!!window.ActiveXObject ? 'keyup' : 'input'],

	/** ���̱�׼�¼� **/
	selectEventType : [navigator.userAgent.toLowerCase().indexOf("opera")!=-1 ? 'keypress' : 'keydown'],

	/** ʵ������ **/
	instanceName   : '',
 
	/** ������textbox **/
	listenTextbox  : null,

	/** ���ص�textbox **/
	returnTextbox  : null,
 
	/** Ĭ��ѡ������ֵ **/
	selectedIndex  : -1,

	/** ����ĵ�ַ **/
	requestURL     : '',

	/** �Ƿ���Ч **/
	disabled       : false,

	/** �û��Ѿ������ֵ **/
	userInputValue : '',

	/** Ŀǰtextbox���ֵ **/
	textboxValue   : '',

	/** �û�ѡ�е�ֵ **/
	userSelectedValue : '',
	
	/** ���� **/
	container      : null,

	/** �¼�timerִ�еļ�� **/
	selectEventInterval : 100,

	interval       : 50,

	_completeItemFlag : 0,


	_lastSelectTime  : null,

	_textChangeTimer : null,

	_panel : null,

	/**
	 * ���캯��
	 * @private
	 * @return {autocomplete}
	 */
	_constructor: function (op) {

		Object.extendJson(this, op||{});

		this.dataMgr = new AutocompleteDataMgr({
			instanceName: this.instanceName,
			classNames: this.classNames
		});

		var instanceName = this.instanceName;
		this.returnTextbox = this.returnTextbox || this.listenTextbox;

		this.addTextboxEventListener();

		this._panel = new SuggestLayer($(this.container));
		this._panel.autoPosition = false;
		this._panel.autocompleteElements = [this.listenTextbox,this.returnTextbox];
		this.listenTextbox.setAttribute('autocomplete','off');
		this.textboxValue = this.getTextboxValue();
		return this;
		
	},

	/**
	 * ���¼�
	 * @private
	 * @return void
	 */
	addTextboxEventListener: function() {

		var instance = this;


/*
		ѭ������ѯ�¼������󶨵���������queryKeyEventHandler */
		this.bindAllEventToTextbox(this.queryEventType, function(e){
				var keyCode = window.event ? event.keyCode : e.which;
				instance.addTextChangeHandler();
				instance.queryKeyEventHandler(e);
		});

		/* �󶨼���ѡ���¼���selectKeyEventHandler*/
		this.bindAllEventToTextbox(this.selectEventType, function(e){
			var now = (new Date()).valueOf();
			var timeRemainder = parseInt(now-this._lastSelectTime,10)||0;
			if (timeRemainder>=this.selectEventInterval) {
				this._lastSelectTime = now;
				this.selectKeyEventHandler(e);
			}
		});

		

		BBEvent.observe(this.listenTextbox,'blur',function() {
			instance.clearTextChangeTimer();
		});

		BBEvent.observe(this.listenTextbox,'focus',function() {
			instance.addTextChangeHandler();
		});


		BBEvent.observe(this.listenTextbox,'keypress',function() {
			instance.addTextChangeHandler();
		});

		if (!!window.ActiveXObject) {
			/**
			 * ������IE��΢��ƴ�����뷨�ڰ����뷨״̬��suggest��click�¼���Ч������
			 * Only IE
			 */
			BBEvent.observe(this.listenTextbox,'beforedeactivate',function(){
				if (instance._completeItemFlag) {
					window.event.cancelBubble = true;
					window.event.returnValue = false;
					instance.listenTextbox.focus();
					instance._completeItemFlag = 0;
				}
				
			});
		}
	},


	clearTextChangeTimer: function() {
		clearInterval(this._textChangeTimer);
	},
	
	addTextChangeHandler: function() {
		var instance = this;
		instance.clearTextChangeTimer();
		
		instance._textChangeTimer = window.setInterval(function () {
			var value = instance.getTextboxValue();
			
			/*
			 * oninput�Զ����¼��Ĵ�������
			 * �ı���ֵ�иı�
			 * �ı���ֵ����suggest�е�ֵ
			 * �ı����ֵ�Ա��û������ֵ�иı�
			 */
			if ((instance.textboxValue!=value && 
				instance.userSelectedValue!=value) || 
				0==value.trim().length) {
				instance.fireInputEvent(instance.EVENT.INPUT, value);
			}
			instance.textboxValue = value;
		}, instance.interval);
	},

	/**
	 * ������һ���¼�������this�󶨵��¼�������
	 * @private
	 * @return {autocomplete}
	 */
	bindAllEventToTextbox: function(arrType, handler) {
		if (!arrType.constructor) throw new Error(['Autocomplete','bindEventToTextbox','event type is invalid(' +arrType+ ')']);
		if (arrType.constructor!=Array) arrType = [arrType];
		var len = arrType.length, self = this;
		for (var i=0; i<len; i++) {
			BBEvent.observe(this.listenTextbox, arrType[i], function(arg) {
				return handler.apply(self,arguments);
			});
		}
	},


	fireInputEvent: function(value) {
		this.dispatchEvent(this.EVENT.INPUT, { 
			selectedIndex: this.selectedIndex, 
			dataSource: this.dataMgr.dataSource,
			inputValue: value
		});
	},


	/**
	 * �����ĳ����Ŀʱ�Ĵ�������
	 * @param {number} index Ϊĳ����Ŀ������
	 * @private
	 * @return void
	 */
	clickHandler: function(index) {
		this.listenTextbox.blur();
		this.entryChangeHandler(this.selectedIndex, index);
		this.setTextboxValue(this.dataMgr.getEntryKey(this.selectedIndex));
		this.enterKeyEventHandler();
	},

	/**
	 * ����Ƶ�ĳ����Ŀʱ�Ĵ�������
	 * @param {number} index Ϊĳ����Ŀ������
	 * @private
	 * @return void
	 */
	overHandler: function(index) {
		this.entryChangeHandler(this.selectedIndex, index);
	},

	/**
	 * ����ƿ�ĳ����Ŀʱ�Ĵ�������
	 * @param {number} index Ϊĳ����Ŀ������
	 * @private
	 * @return void
	 */
	outHandler: function(index) {
		this.entryChangeHandler(index, this.selectedIndex);
	},

	mousedownHandler: function(e, index) {
		var instance = this;
		this._completeItemFlag = 1;
	},

	/**
	 * ����ѡ���¼��Ĵ�������
	 * @param {event} e ������¼�����
	 * @private
	 * @return void
	 */
	selectKeyEventHandler: function(e) {
		if (this.textboxValue=='') return; //��ֵʱ�˳�

		var keyCode = window.event ? event.keyCode : e.which;
		var currentIndex = this.selectedIndex;
		
		switch(keyCode) {

			case this.keyMgr.UP:
				/*START:Added by Miller*/
				if( !this.dataMgr.selectable() ) return;
				/*END:Added by Miller*/
				currentIndex--;
				break;

			case this.keyMgr.DOWN:
				/*START:Added by Miller*/
				if( !this.dataMgr.selectable() ) return;
				/*END:Added by Miller*/
				currentIndex++;
				break;

			case this.keyMgr.ESC:
				this.hide();
				return;

			case this.keyMgr.ENTER:
				/*START:Added by Miller*/
				//������⣺�ڻ�Ʊ��Suggest�У�������س�ֻ��ѡ�У����ñ����ύ
				if( this._panel.isVisible() )
					BBEvent.preventDefault(e);
				/*END:Added by Miller*/
				this.dispatchEvent(this.EVENT.ENTER);
				this.enterKeyEventHandler();
				return;

			default:
				return;
		}

		if (!this._panel.isVisible()) {
			/*�Զ���ɵ�����δ����ʱ������selectedIndex*/
			this.show();
			currentIndex = this.selectedIndex;
		}

		currentIndex = this.fixSelectedIndex(currentIndex);
		this.entryChangeHandler(this.selectedIndex, currentIndex);
		var instance = this;
		if (-1 != this.selectedIndex) {
			var entryValue = instance.dataMgr.getEntryKey(this.selectedIndex);
			instance.userSelectedValue = entryValue;
			instance.setTextboxValue(entryValue);
		}
		
	},

	/**
	 * �Զ����¼�����ǲ�������Զ���ɵ��Զ����¼�ͳһ������ִ��
	 * @param {string} eventTypeΪ�Զ����¼�������
	 * @return void
	 */
	dispatchEvent: function(eventType, eventArgs) {
		eventArgs = eventArgs || { 
			selectedIndex: this.selectedIndex, 
			dataSource: this.dataMgr.dataSource,
			inputValue: this.userInputValue
		};
		CustEvent.fireEvent(this, eventType, eventArgs);
	},

	/**
	 * Ĭ�ϼ����¼��Ĵ�������
	 * @param {event} e ����Ϊ�β���keyCode�����ǵ��Ƚ�������չ�˺�����˴����¼�����
	 * @private
	 * @return void
	 */
	queryKeyEventHandler: function(e) {
		var keyCode = window.event ? event.keyCode : e.which;
		if (!this.keyMgr.availableKeyCode(keyCode)) return;
		this.userInputValue = this.getTextboxValue();
		//this.dispatchEvent(this.EVENT.INPUT);
	},

	/**
	 * ��������Դ����ԭselectedIndex������ʾ�Զ���ɵ�����
	 * @param {array} dataSource ����AutocompleteDataMgr�ṩ�Ľӿ��ṩ���ݼ�
	 * @return void
	 */
	showDataSource: function(dataSource) {
		this.hide();
		this.setDataSource(dataSource);
		this.resetSelectedIndex();
		this.show();
	},

	/**
	 * ����selecedIndex
	 * @return void
	 */
	resetSelectedIndex: function() {
		this.selectedIndex = -1;
	},

	/**
	 * ����selectedIndex���ԣ������������Ŀ����Ϊ-1�����С��-1����selectedIndexΪdatasource����-1
	 * @param {number} index �����±�
	 * @return void
	 */
	fixSelectedIndex: function(index) {
		return this.dataMgr.fixIndex(index);
	},

	/**
	 * ���û�ѡ����Ŀ�����ı�ʱ���ı�������className
	 * @param {number} beforeIndex �ı�ǰ������
	 * @param {number} afterindex �ı�������
	 * @return void
	 */
	entryChangeHandler: function(beforeIndex, afterIndex) {
		if (beforeIndex!=afterIndex) this.dispatchEvent(this.EVENT.CHANGE);
		this.dataMgr.gotoEntry(beforeIndex, afterIndex);
		if (-1===afterIndex && this.userInputValue) this.setTextboxValue(this.userInputValue);
		this.selectedIndex = afterIndex;
	},

	/**
	 * ��ѡ��ĳ����������߰��س����Ĵ���������Ĭ�������Ǽ��̵Ļس���������ѡ�񶼻ᴥ��EVENT.SELECT�¼�
	 * @return void
	 */
	enterKeyEventHandler: function() {
		this.dispatchEvent(this.EVENT.SELECT);
		this.hide();
	},

	/**
	 * �������ݼ���
	 * @param  {array} dataSource ����Լ���ļ�AutocompleteDataMgrԼ���ṩ�����ݼ�
	 * @return void
	 */
	setDataSource: function(data) {
		this.dataMgr.dataSource = data||[];
	},

	/**
	 * ������ݼ���
	 * @return void
	 */
	clearDataSource: function() {
		this.dataMgr.clear();
	},

	/**
	 * �õ����ı����ֵ
	 * @return void
	 */
	getTextboxValue: function() {
		return this.listenTextbox.value;
	},

	/**
	 * ���ð󶨵��Զ�����ı����ֵ
	 * @param {string} value Ҫ���õ��ı���ֵ���ַ���
	 * @return void
	 */
	setTextboxValue: function(value) {
		if (null === value) return;
		if (this.returnTextbox.createTextRange) this.returnTextbox.createTextRange().text = value;
		else this.returnTextbox.value = value;		
		/*START:Added by Miller @ 2010/1/12*/
		//��������⣺��Suggest�б���ѡ��һ��������ٴε�������ᵼ���ٴ�����Suggest
		//ԭ������this.textboxValue��ֵ�뵱ǰ�����Ĳ�һ��
		this.textboxValue = value;
		/*END:Added by Miller @ 2010/1/12*/
	},

	/**
	 * չʾ�Զ���ɵ�popup
	 * @return void
	 */
	show: function(x, y, w, h, el) {
		
		if (!!this.disabled) return;
		this.dispatchEvent(this.EVENT.SHOW);

		this._panel.setContent(this.dataMgr.format());
		this._panel.show();
	},

	/**
	 * �����Զ���ɵ�popup
	 * @return void
	 */
	hide: function() {
		this.dispatchEvent(this.EVENT.HIDE);
		this._panel.hide();	
	}

};


