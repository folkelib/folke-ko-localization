import * as ko from "knockout";

export type Dictionary<T> = {[key:string]:T};

export var keys:Dictionary<string> = {};

export function register(text: Dictionary<Dictionary<string>>) {
    for (let key in text) {
        const mod = text[key];
        for (let sub in mod) {
            const line = mod[sub];
            keys[key + '.' + sub] = line;
        }
    }

    if (ko.bindingHandlers['locf']) return;

    // A binding handler that set the text content with a format ({n} is replaced by the nth parameter)
    ko.bindingHandlers['locf'] = {
        update: (element: HTMLElement, valueAccessor: () => any[]) => {
            const parameters = valueAccessor();
            let text = keys[parameters[0]];
            for (let i = 1; i < parameters.length; i++) {
                text = text.replace('{' + (i - 1) + '}', ko.unwrap(parameters[i]));
            }
            element.innerHTML = text;
        }
    }

    // A binding handler to set attribute values
    ko.bindingHandlers['loca'] = {
        update: (element: HTMLElement, valueAccessor: () => any) => {
            const parameters = valueAccessor();
            for (let key in parameters) {
                const value = parameters[key];
                element.setAttribute(key, keys[value]);
            }
        }
    };

    ko.bindingProvider.instance['preprocessNode'] = function (node: Node) {
        if (node.nodeType === node.ELEMENT_NODE) {
            const element = <HTMLElement>node;
            for (let i = 0; i < element.attributes.length; i++) {
                const attribute = element.attributes[i];
                let value = attribute.value;
                if (value.indexOf("{{") == 0) {
                    value = value.substr(2, value.length - 4);
                    element.removeAttribute(attribute.name);
                    if (element.hasAttribute('data-bind')) {
                        element.attributes.getNamedItem('data-bind').value += ',loca: {' + attribute.name + ':"' + value + '"}';
                    }
                    else {
                        element.setAttribute('data-bind', 'loca: {' + attribute.name + ':"' + value + '"}');
                    }
                }
            }
        }

        if (node.nodeType === 3) {

            if (node.nodeValue && node.nodeValue.indexOf('{{nohtml|') !== -1) {
                node.nodeValue = node.nodeValue.replace(/{{nohtml\|(.*?)}}/, (match, id) => keys[id] || id);
                return [node];
            }
            else if (node.nodeValue && node.nodeValue.indexOf('{{') !== -1) {
                if (node.nodeValue.indexOf(',') !== -1) {
                    const newElement = document.createElement('span');
                    const value = node.nodeValue.match(/{{(.*?)}}/)[1];
                    const parameters = value.split(',');
                    parameters[0] = "'" + parameters[0] + "'";
                    newElement.setAttribute('data-bind', 'locf: [' + parameters.join(',') + ']');
                    node.parentNode.replaceChild(newElement, node);
                    return [newElement];
                }
                else {
                    const newElement = document.createElement('span');
                    newElement.innerHTML = node.nodeValue.replace(/{{(.*?)}}/, (match, id) => keys[id] || id);
                    node.parentNode.replaceChild(newElement, node);
                    return [newElement];
                }
            }
        }
    }
}
