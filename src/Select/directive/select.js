import { dependencies } from '../../external/dependencies'
import { onMotionEnd, transition } from '../../utils/transition'
import select from '../template/select.html'
import option from '../template/option.html'
import tags from '../template/tags.html'
import {
    on,
    last,
    toDOM,
    query,
    props,
    remove,
    replace,
    prepend,
    getType,
    debounce,
    getStyle,
    addClass,
    queryAll,
    getDOMState,
    removeClass,
    replaceClass
} from '../../utils'




//do not use ngModel remark
export class Select {
    constructor(){
        this.restrict = 'EA'
        this.replace = true
        this.template = select
        //this.require = "^ngModel"
        this.scope = {
            value:'='
        }
        this.transclude = true
    }

    compile($tElement, tAttrs, transclude){
        let isSearch = $tElement::props('search')
        let isMulti = $tElement::props('multi')
        let isTags = $tElement::props('tags')

        let rootDOM = $tElement[0]
        let select = rootDOM::query('.fm-select-inner')
        let optionList = rootDOM::query('.fm-select-optionList')
        let icon = rootDOM::query('.fm-select-icon')
        this.size = ($tElement::props('size') || 'default').toLowerCase()

        if(!(isMulti || isTags) && isSearch){
            let searchTmpl = `<div><input placeholder="{{::('pleaseInput' | translate)}}"/></div>`
            optionList::prepend(searchTmpl)
            this.isSearch = true
        }

        if(isMulti || isTags){
            this.mode = isTags ? 'tags' : 'multi'
            let tagsDOM = toDOM(tags)
            if(isTags){
                tagsDOM::last(`
                    <li class="fm-tag-input">
                        <span contenteditable="true">&nbsp;</span>
                    </li>
                `)
            }
            let selection = select::query('.fm-select-selection')
            select::addClass('fm-select-tags')
            selection::replace(tagsDOM)
            this.icon = icon::remove()
        }

        return this.link
    }



    @dependencies('$scope', '$attrs', '$element')
    controller(scope, attrs, $elem){
        let rootDOM = $elem[0]

        let optionList = rootDOM::query('.fm-select-optionList')

        if(this.mode === 'multi' || this.mode ==='tags'){
            scope.value = []
            scope.tagsRef = []
        } else {
            scope.$on('option::selected', (e, target) => {
                let options = Array.from(optionList::queryAll('ul > li'))
                options.forEach(i => {
                    if(i !== target) i.removeAttribute('selected')
                })

                e.stopPropagation()
            })
        }

        scope.remove = (index, e) => {
            scope.value.splice(index, 1).pop()
            if(this.mode !== 'tags'){
                let elem = scope.tagsRef.splice(index, 1).pop()
                elem::removeClass('tagged').removeAttribute('selected')
            }
            e.stopPropagation()
        }

        let selected = () => {
            if(scope.value::getType() !== 'Array') {
                return {
                    item: scope.value.item,
                    data: scope.value.data
                }
            } else {
                let list = []
                for(var i = 0; i< scope.value.length; i++){
                    let model = scope.value[i]
                    list.push({
                        item: model.item,
                        data: model.data
                    })
                }
                return list
            }
        }

        scope.control = { selected }
        let listTransition = new transition(optionList, 'fm-select-list', false)

        scope.showOptionList = () => {
            if(this.icon){
                !listTransition.state
                ? this.icon::addClass('fm-icon-actived')
                : this.icon::removeClass('fm-icon-actived')
            }

            listTransition.state = !listTransition.state
        }

        this.rootDOM = rootDOM
        this.optionList = optionList
        this.select = rootDOM::query('.fm-select-inner')
    }


    link(scope, $elem, attrs, ctrl){
        if(this.isSearch){
            let searchInput = this.optionList::query('input')
            let fn = debounce(() => {
                let options = this.optionList::queryAll('span')
                let val = searchInput.value

                let cb1 = e => {
                    new RegExp(val, 'ig').test(e.innerText)
                    ? e.parentElement::removeClass('hide')
                    : e.parentElement::addClass('hide')
                }

                let cb2 = e => e.parentElement::removeClass('hide')
                options::[].forEach(val ? cb1 : cb2)
            })
            searchInput::on('input', fn)
        }

        this.rootDOM::addClass(`fm-select-wrapper-${this.size}`)
        this.select::on('click', scope.showOptionList)

        if(this.mode === 'tags'){

            let tagInput = this.rootDOM::query('.fm-tag-input > span')

            let renderTag = value => {
                scope.value.push({ item: value, data: { value }, $elem: null })
                tagInput.innerHTML = '&nbsp;'
                scope.$apply()
            }

            this.select::on('click', () => tagInput.focus())
            tagInput::on('keydown', e => {
                let value = tagInput.innerText.trim()
                if(e.keyCode !== 13) return
                e.preventDefault()
                if(value !== ''){
                    if(scope.value.every(existOption => existOption.item !== value)){
                        renderTag(value)
                    } else {
                        tagInput.innerHTML = '&nbsp;'
                    }
                }
            })

            tagInput::on('blur', e => {
                let value = tagInput.innerText.trim()
                if(value === '') return
                renderTag(value)
            })
        }
    }

    passing(exports, scope){
        exports.select = (option, elem) => {
            if(this.mode === 'multi' || this.mode === 'tags' ){
                if(scope.value.every(existOption => existOption !== option)){
                    scope.value.push(option)
                    scope.tagsRef.push(elem)
                }
            } else {
                scope.value = option
            }

            if(!/\$apply|\$digest/.test(scope.$root.$$phase)){
                scope.$apply()
            }
        }
        exports.showList = () => scope.showOptionList()
        exports.mode = this.mode
    }
}


//select option group (IMPLEMENT ME!)
export class Option {
    constructor(){
        this.restrict = 'EA'
        this.replace = true
        this.require = '^fermiSelect'
        this.template = option
        this.transclude = true
        this.scope = { value:'=', data:'=' }
    }

    link(scope, $elem, attrs, parentCtrl){
        let rootDOM = $elem[0]
        if(typeof attrs.value === "string" && scope.value === undefined){
            scope.value = attrs.value
        }

        let isSelected = $elem::props('selected')
        let option = {
            item:scope.value,
            data:scope.data || {value: scope.value}
        }
        
        let selected = e => {
            let disabled = rootDOM::props('disabled')
            if(disabled) return

            if(parentCtrl.mode !== 'multi' && parentCtrl.mode !== 'tags'){
                scope.$emit('option::selected', rootDOM)
                parentCtrl.showList()
            } else {
                rootDOM::addClass('tagged')
            }

            rootDOM.setAttribute('selected', true)
            parentCtrl.select(option, rootDOM)
        }

        rootDOM::on('click', selected)

        if(isSelected){
            selected(null)
        }
    }
}
